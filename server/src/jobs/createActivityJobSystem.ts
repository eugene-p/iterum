import {
  buildQueue,
  buildRouter,
  gracefulStop,
  retryWorker,
  whenIdle,
  withDlq,
  withWorker,
  type Queue,
  type RouteMessage,
  type RowStore,
} from "@qkitt/queue";
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
  persistence?: ActivityJobPersistence;
};

type ActivityJob = ActivityImportedPayload;
type RoutedActivityJob = RouteMessage<ActivityJob>;

export type ActivityJobPersistence = {
  createStore: (queueName: string) => RowStore<RoutedActivityJob>;
  close?: () => void;
  leaseTtlMs?: number;
};

type WorkerQueue = Queue<RoutedActivityJob> & {
  stop: () => void;
  isProcessing: () => boolean;
};

const activityIdFromJob = (job: ActivityJob): number => job.activityId;

const attachFailureLogging = (
  queue: {
    on: (
      event: "worker:failed",
      cb: (payload: { item: RoutedActivityJob; error: unknown }) => void,
    ) => () => void;
  },
  onFailed: ((activityId: number, error: unknown) => void) | undefined,
): (() => void) | undefined => {
  if (!onFailed) return undefined;
  return queue.on("worker:failed", ({ item, error }) => {
    onFailed(activityIdFromJob(item.data), error);
  });
};

const buildWorkerQueue = (
  name: string,
  run: (job: ActivityJob) => Promise<unknown>,
  concurrency: number,
  store?: RowStore<RoutedActivityJob>,
  leaseTtlMs?: number,
): WorkerQueue =>
  withWorker(
    buildQueue<RoutedActivityJob>({ name, store, leaseTtlMs }),
    async ({ data }: RoutedActivityJob) => run(data),
    { concurrency, autoStart: false },
  );

export type ActivityJobSystem = {
  publishActivityImported: (activityId: number) => Promise<number>;
  flushAll: () => Promise<void>;
  stop: () => Promise<void>;
  queues: {
    geocode: WorkerQueue;
    match: WorkerQueue;
    preview: WorkerQueue;
  };
};

/**
 * In-process job system for post-import side effects. A configured RowStore
 * preserves queue rows across restarts; workers remain process-local.
 */
export const createActivityJobSystem = async (
  options: CreateActivityJobSystemOptions,
): Promise<ActivityJobSystem> => {
  const geocodeConcurrency = options.geocodeConcurrency ?? 1;
  const matchConcurrency = options.matchConcurrency ?? 1;
  const previewConcurrency = options.previewConcurrency ?? 1;
  const geocodeRetries = options.geocodeRetries ?? GEOCODE_WORKER_RETRIES;
  const { handlers } = options;
  const { persistence } = options;

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
    persistence?.createStore(ACTIVITY_JOB_QUEUES.geocode),
    persistence?.leaseTtlMs,
  );
  const match = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.match,
    async (job) => {
      await handlers.matchActivity(activityIdFromJob(job));
    },
    matchConcurrency,
    persistence?.createStore(ACTIVITY_JOB_QUEUES.match),
    persistence?.leaseTtlMs,
  );
  const preview = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.preview,
    async (job) => {
      await handlers.warmPreview(activityIdFromJob(job));
    },
    previewConcurrency,
    persistence?.createStore(ACTIVITY_JOB_QUEUES.preview),
    persistence?.leaseTtlMs,
  );

  const deadLetters = {
    geocode: buildQueue<RoutedActivityJob>({
      name: `${ACTIVITY_JOB_QUEUES.geocode}_failed`,
      store: persistence?.createStore(`${ACTIVITY_JOB_QUEUES.geocode}_failed`),
    }),
    match: buildQueue<RoutedActivityJob>({
      name: `${ACTIVITY_JOB_QUEUES.match}_failed`,
      store: persistence?.createStore(`${ACTIVITY_JOB_QUEUES.match}_failed`),
    }),
    preview: buildQueue<RoutedActivityJob>({
      name: `${ACTIVITY_JOB_QUEUES.preview}_failed`,
      store: persistence?.createStore(`${ACTIVITY_JOB_QUEUES.preview}_failed`),
    }),
  };

  await Promise.all([
    geocode.hydrate(),
    match.hydrate(),
    preview.hydrate(),
    deadLetters.geocode.hydrate(),
    deadLetters.match.hydrate(),
    deadLetters.preview.hydrate(),
  ]);

  const durableGeocode = withDlq(geocode, deadLetters.geocode);
  const durableMatch = withDlq(match, deadLetters.match);
  const durablePreview = withDlq(preview, deadLetters.preview);
  durableGeocode.start();
  durableMatch.start();
  durablePreview.start();

  const unsubGeocode = attachFailureLogging(durableGeocode, handlers.onGeocodeFailed);
  const unsubMatch = attachFailureLogging(durableMatch, handlers.onMatchFailed);
  const unsubPreview = attachFailureLogging(durablePreview, handlers.onPreviewFailed);
  const topics = buildRouter();
  const unbindGeocode = topics.bind(ACTIVITY_IMPORTED_TOPIC, durableGeocode);
  const unbindMatch = topics.bind(ACTIVITY_IMPORTED_TOPIC, durableMatch);
  const unbindPreview = topics.bind(ACTIVITY_IMPORTED_TOPIC, durablePreview);

  const queues = { geocode: durableGeocode, match: durableMatch, preview: durablePreview } as const;

  return {
    publishActivityImported: async (activityId: number) => {
      const matched = topics.publish(ACTIVITY_IMPORTED_TOPIC, { activityId });
      await Promise.all([durableGeocode.flush(), durableMatch.flush(), durablePreview.flush()]);
      return matched;
    },
    flushAll: async () => {
      await Promise.all([
        whenIdle(geocode),
        whenIdle(match),
        whenIdle(preview),
      ]);
    },
    stop: async () => {
      unsubGeocode?.();
      unsubMatch?.();
      unsubPreview?.();
      unbindGeocode();
      unbindMatch();
      unbindPreview();
      await Promise.all([
        gracefulStop(durableGeocode, { flush: true, timeoutMs: 30_000 }),
        gracefulStop(durableMatch, { flush: true, timeoutMs: 30_000 }),
        gracefulStop(durablePreview, { flush: true, timeoutMs: 30_000 }),
      ]);
      await Promise.all([
        deadLetters.geocode.flush(),
        deadLetters.match.flush(),
        deadLetters.preview.flush(),
      ]);
      persistence?.close?.();
    },
    queues,
  };
};
