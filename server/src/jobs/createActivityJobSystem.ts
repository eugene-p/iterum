import type { RouteMessage } from "@qkitt/queue";
import { retryWorker } from "@qkitt/queue";
import { buildFromConfig, defineConfig } from "@qkitt/queue-config";
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

type ActivityRouteMessage = RouteMessage<ActivityImportedPayload>;

const activityIdFromMessage = (msg: ActivityRouteMessage): number =>
  msg.data.activityId;

const attachFailureLogging = (
  queue: {
    on: (
      event: "worker:failed",
      cb: (payload: { item: ActivityRouteMessage; error: unknown }) => void,
    ) => () => void;
  },
  onFailed: ((activityId: number, error: unknown) => void) | undefined,
): (() => void) | undefined => {
  if (!onFailed) return undefined;
  return queue.on("worker:failed", ({ item, error }) => {
    onFailed(activityIdFromMessage(item), error);
  });
};

export type ActivityJobSystem = {
  publishActivityImported: (activityId: number) => number;
  flushAll: () => Promise<void>;
  stop: () => void;
  router: NonNullable<
    Awaited<ReturnType<typeof buildActivityJobSystemFromConfig>>["router"]
  >;
  queues: Awaited<ReturnType<typeof buildActivityJobSystemFromConfig>>["queues"];
};

const buildActivityJobSystemFromConfig = async (
  options: CreateActivityJobSystemOptions,
) => {
  const geocodeConcurrency = options.geocodeConcurrency ?? 1;
  const matchConcurrency = options.matchConcurrency ?? 1;
  const previewConcurrency = options.previewConcurrency ?? 1;
  const geocodeRetries = options.geocodeRetries ?? GEOCODE_WORKER_RETRIES;
  const { handlers } = options;

  const geocodeRun = retryWorker(
    async (msg: ActivityRouteMessage) => {
      await handlers.geocodeActivity(activityIdFromMessage(msg));
    },
    {
      retries: geocodeRetries,
      delay: (attempt: number) => 200 * 2 ** (attempt - 1),
    },
  );

  const config = defineConfig({
    queues: {
      [ACTIVITY_JOB_QUEUES.geocode]: {
        worker: {
          run: geocodeRun,
          concurrency: geocodeConcurrency,
        },
      },
      [ACTIVITY_JOB_QUEUES.match]: {
        worker: {
          run: async (msg: ActivityRouteMessage) => {
            await handlers.matchActivity(activityIdFromMessage(msg));
          },
          concurrency: matchConcurrency,
        },
      },
      [ACTIVITY_JOB_QUEUES.preview]: {
        worker: {
          run: async (msg: ActivityRouteMessage) => {
            await handlers.warmPreview(activityIdFromMessage(msg));
          },
          concurrency: previewConcurrency,
        },
      },
      [ACTIVITY_JOB_QUEUES.unrouted]: {},
    },
    router: {
      bindings: [
        {
          pattern: ACTIVITY_IMPORTED_TOPIC,
          queue: ACTIVITY_JOB_QUEUES.geocode,
        },
        {
          pattern: ACTIVITY_IMPORTED_TOPIC,
          queue: ACTIVITY_JOB_QUEUES.match,
        },
        {
          pattern: ACTIVITY_IMPORTED_TOPIC,
          queue: ACTIVITY_JOB_QUEUES.preview,
        },
      ],
      unmatchedQueue: ACTIVITY_JOB_QUEUES.unrouted,
    },
  });

  return buildFromConfig(config);
};

/**
 * In-process job system for post-import side effects.
 * Publishes `activity.imported` → geocode + match + preview worker queues.
 */
export const createActivityJobSystem = async (
  options: CreateActivityJobSystemOptions,
): Promise<ActivityJobSystem> => {
  const system = await buildActivityJobSystemFromConfig(options);
  const { handlers } = options;

  const unsubGeocode = attachFailureLogging(
    system.queues.geocode,
    handlers.onGeocodeFailed,
  );
  const unsubMatch = attachFailureLogging(
    system.queues.match,
    handlers.onMatchFailed,
  );
  const unsubPreview = attachFailureLogging(
    system.queues.preview,
    handlers.onPreviewFailed,
  );

  const router = system.router;
  if (!router) {
    throw new Error("Activity job system requires a router");
  }

  return {
    publishActivityImported: (activityId: number) =>
      router.publish(ACTIVITY_IMPORTED_TOPIC, { activityId }),
    flushAll: () => system.flushAll(),
    stop: () => {
      unsubGeocode?.();
      unsubMatch?.();
      unsubPreview?.();
      system.queues.geocode.stop();
      system.queues.match.stop();
      system.queues.preview.stop();
    },
    router,
    queues: system.queues,
  };
};
