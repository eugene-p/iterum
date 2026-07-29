import {
  buildQueue,
  retryWorker,
  whenIdle,
  withWorker,
  type Queue,
} from "@qkitt/tinyq";
import {
  ACTIVITY_IMPORTED_TOPIC,
  ACTIVITY_JOB_QUEUES,
  GEOCODE_WORKER_RETRIES,
  type ActivityImportedPayload,
} from "./activityImportTopics.js";

export {
  ACTIVITY_IMPORTED_TOPIC,
  ACTIVITY_JOB_QUEUES,
  GEOCODE_WORKER_RETRIES,
};
export type { ActivityImportedPayload };

export type ActivityJobHandlers = {
  geocodeActivity: (activityId: number) => Promise<void>;
  matchActivity: (activityId: number) => Promise<void>;
  warmPreview: (activityId: number) => Promise<void>;
  onGeocodeFailed?: (activityId: number, error: unknown) => void;
  onMatchFailed?: (activityId: number, error: unknown) => void;
  onPreviewFailed?: (activityId: number, error: unknown) => void;
};

export type CreateActivityJobSystemOptions = {
  handlers: ActivityJobHandlers;
  geocodeConcurrency?: number;
  matchConcurrency?: number;
  previewConcurrency?: number;
  geocodeRetries?: number;
};

type ActivityJob = ActivityImportedPayload;

type WorkerQueue = Queue<ActivityJob> & {
  stop: () => void;
  isProcessing: () => boolean;
};

const activityIdFromJob = (job: ActivityJob): number => job.activityId;

const attachFailureLogging = (
  queue: {
    on: (
      event: "worker:failed",
      cb: (payload: { item: ActivityJob; error: unknown }) => void,
    ) => () => void;
  },
  onFailed: ((activityId: number, error: unknown) => void) | undefined,
): (() => void) | undefined => {
  if (!onFailed) return undefined;
  return queue.on("worker:failed", ({ item, error }) => {
    onFailed(activityIdFromJob(item), error);
  });
};

const buildWorkerQueue = (
  name: string,
  run: (job: ActivityJob) => Promise<unknown>,
  concurrency: number,
): WorkerQueue =>
  withWorker(buildQueue<ActivityJob>({ name }), run, { concurrency });

export type ActivityJobSystem = {
  publishActivityImported: (activityId: number) => number;
  flushAll: () => Promise<void>;
  stop: () => void;
  queues: {
    geocode: WorkerQueue;
    match: WorkerQueue;
    preview: WorkerQueue;
  };
};

/**
 * In-process job system for post-import side effects.
 * Fan-outs `activity.imported` to geocode + match + preview worker queues.
 */
export const createActivityJobSystem = async (
  options: CreateActivityJobSystemOptions,
): Promise<ActivityJobSystem> => {
  const geocodeConcurrency = options.geocodeConcurrency ?? 1;
  const matchConcurrency = options.matchConcurrency ?? 1;
  const previewConcurrency = options.previewConcurrency ?? 1;
  const geocodeRetries = options.geocodeRetries ?? GEOCODE_WORKER_RETRIES;
  const { handlers } = options;

  const geocodeRun = retryWorker(
    async (job: ActivityJob) => {
      await handlers.geocodeActivity(activityIdFromJob(job));
    },
    {
      retries: geocodeRetries,
      delay: (attempt: number) => 200 * 2 ** (attempt - 1),
    },
  );

  const geocode = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.geocode,
    geocodeRun,
    geocodeConcurrency,
  );
  const match = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.match,
    async (job) => {
      await handlers.matchActivity(activityIdFromJob(job));
    },
    matchConcurrency,
  );
  const preview = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.preview,
    async (job) => {
      await handlers.warmPreview(activityIdFromJob(job));
    },
    previewConcurrency,
  );

  const unsubGeocode = attachFailureLogging(geocode, handlers.onGeocodeFailed);
  const unsubMatch = attachFailureLogging(match, handlers.onMatchFailed);
  const unsubPreview = attachFailureLogging(preview, handlers.onPreviewFailed);

  const queues = { geocode, match, preview } as const;

  return {
    publishActivityImported: (activityId: number) => {
      geocode.enqueue({ activityId });
      match.enqueue({ activityId });
      preview.enqueue({ activityId });
      return 3;
    },
    flushAll: async () => {
      await Promise.all([
        whenIdle(geocode),
        whenIdle(match),
        whenIdle(preview),
      ]);
    },
    stop: () => {
      unsubGeocode?.();
      unsubMatch?.();
      unsubPreview?.();
      geocode.stop();
      match.stop();
      preview.stop();
    },
    queues,
  };
};
