import {
  buildQueue,
  buildRouter,
  gracefulStop,
  whenIdle,
  withDlq,
  withRetry,
  withWorker,
  type Queue,
  type RouteMessage,
  type RowStore,
  type WorkerContext,
} from "@qkitt/queue";
import {
  ACTIVITY_IMPORTED_TOPIC,
  ACTIVITY_JOB_QUEUES,
  ACTIVITY_JOB_TIMEOUT_MS,
  GEOCODE_RETRY_INITIAL_DELAY_MS,
  GEOCODE_RETRY_MAX_DELAY_MS,
  GEOCODE_WORKER_RETRIES,
  type ActivityImportedPayload,
} from "./activityImportTopics.js";

export {
  ACTIVITY_IMPORTED_TOPIC,
  ACTIVITY_JOB_QUEUES,
  ACTIVITY_JOB_TIMEOUT_MS,
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
  geocodeTimeoutMs?: number;
  matchTimeoutMs?: number;
  previewTimeoutMs?: number;
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
  activeCount: () => number;
};

export type ActivityJobQueueCounts = {
  pending: number;
  active: number;
};

export type ActivityJobQueueStatus = {
  work: {
    geocode: ActivityJobQueueCounts;
    match: ActivityJobQueueCounts;
    preview: ActivityJobQueueCounts;
  };
  dlq: {
    geocode: number;
    match: number;
    preview: number;
  };
};

const activityIdFromJob = (job: ActivityJob): number => job.activityId;

const raceAbort = async <T>(work: Promise<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) {
    throw signal.reason ?? new Error("aborted");
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(signal.reason ?? new Error("aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
};

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

const workCountsFrom = (queue: WorkerQueue): ActivityJobQueueCounts => {
  const stats = queue.stats();
  return {
    pending: stats.available + stats.delayed,
    active: Math.max(queue.activeCount(), stats.leased),
  };
};

const buildWorkerQueue = (
  name: string,
  run: (job: ActivityJob) => Promise<unknown>,
  concurrency: number,
  timeoutMs: number,
  store?: RowStore<RoutedActivityJob>,
  leaseTtlMs?: number,
): WorkerQueue =>
  withWorker(
    buildQueue<RoutedActivityJob>({ name, store, leaseTtlMs }),
    async ({ data }: RoutedActivityJob, context?: WorkerContext) => {
      const work = run(data);
      return context ? raceAbort(work, context.signal) : work;
    },
    { concurrency, autoStart: false, timeoutMs },
  );

export type ActivityJobSystem = {
  publishActivityImported: (activityId: number) => Promise<number>;
  flushAll: () => Promise<void>;
  stop: () => Promise<void>;
  jobQueueStatus: () => ActivityJobQueueStatus;
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
  const geocodeTimeoutMs = options.geocodeTimeoutMs ?? ACTIVITY_JOB_TIMEOUT_MS.geocode;
  const matchTimeoutMs = options.matchTimeoutMs ?? ACTIVITY_JOB_TIMEOUT_MS.match;
  const previewTimeoutMs = options.previewTimeoutMs ?? ACTIVITY_JOB_TIMEOUT_MS.preview;
  const { handlers } = options;
  const { persistence } = options;

  const geocodeBase = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.geocode,
    async (job) => {
      await handlers.geocodeActivity(activityIdFromJob(job));
    },
    geocodeConcurrency,
    geocodeTimeoutMs,
    persistence?.createStore(ACTIVITY_JOB_QUEUES.geocode),
    persistence?.leaseTtlMs,
  );
  const geocode = withRetry(geocodeBase, {
    maxAttempts: geocodeRetries + 1,
    initialDelayMs: GEOCODE_RETRY_INITIAL_DELAY_MS,
    maxDelayMs: GEOCODE_RETRY_MAX_DELAY_MS,
  });
  const match = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.match,
    async (job) => {
      await handlers.matchActivity(activityIdFromJob(job));
    },
    matchConcurrency,
    matchTimeoutMs,
    persistence?.createStore(ACTIVITY_JOB_QUEUES.match),
    persistence?.leaseTtlMs,
  );
  const preview = buildWorkerQueue(
    ACTIVITY_JOB_QUEUES.preview,
    async (job) => {
      await handlers.warmPreview(activityIdFromJob(job));
    },
    previewConcurrency,
    previewTimeoutMs,
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
      await Promise.all([whenIdle(geocode), whenIdle(match), whenIdle(preview)]);
    },
    jobQueueStatus: (): ActivityJobQueueStatus => ({
      work: {
        geocode: workCountsFrom(durableGeocode),
        match: workCountsFrom(durableMatch),
        preview: workCountsFrom(durablePreview),
      },
      dlq: {
        geocode: deadLetters.geocode.size(),
        match: deadLetters.match.size(),
        preview: deadLetters.preview.size(),
      },
    }),
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
