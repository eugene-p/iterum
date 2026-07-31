import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNodeSqliteRowStore } from "@qkitt/queue-adapter-node-sqlite";
import type { RouteMessage } from "@qkitt/queue";
import { geocodeActivity } from "../services/geocodeActivity.js";
import { warmActivityPreviewImage } from "../services/routePreview/routePreviewService.js";
import {
  logMatchFailure,
  matchActivityAgainstAllSegments,
} from "../services/segmentMatching.js";
import {
  createActivityJobSystem,
  type ActivityJobPersistence,
  type ActivityJobQueueStatus,
  type ActivityJobSystem,
} from "./createActivityJobSystem.js";
import type { ActivityImportedPayload } from "./activityImportTopics.js";

export type { ActivityJobQueueStatus };

const emptyJobQueueStatus = (): ActivityJobQueueStatus => ({
  work: {
    geocode: { pending: 0, active: 0 },
    match: { pending: 0, active: 0 },
    preview: { pending: 0, active: 0 },
  },
  dlq: { geocode: 0, match: 0, preview: 0 },
});

let system: ActivityJobSystem | null = null;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOB_QUEUE_DB_PATH =
  process.env.JOB_QUEUE_DB_PATH ?? path.resolve(__dirname, "../../data/jobs.sqlite");
const ACTIVITY_JOB_LEASE_TTL_MS = 15 * 60 * 1000;

const createActivityJobPersistence = (): ActivityJobPersistence => {
  const stores = new Set<ReturnType<typeof createNodeSqliteRowStore<RouteMessage<ActivityImportedPayload>>>>();

  return {
    createStore: (queueName) => {
      const store = createNodeSqliteRowStore<RouteMessage<ActivityImportedPayload>>({
        filename: JOB_QUEUE_DB_PATH,
        tableName: `activity_${queueName}`,
      });
      stores.add(store);
      return store;
    },
    leaseTtlMs: ACTIVITY_JOB_LEASE_TTL_MS,
    close: () => {
      for (const store of stores) store.close();
    },
  };
};

const logGeocodeFailure = (activityId: number, error: unknown): void => {
  console.error(
    `Activity geocode failed (activity #${activityId}):`,
    error instanceof Error ? error.message : error,
  );
};

const logPreviewFailure = (activityId: number, error: unknown): void => {
  console.error(
    `Activity preview warm failed (activity #${activityId}):`,
    error instanceof Error ? error.message : error,
  );
};

export type StartActivityJobsOptions = {
  /** Use null for an in-memory system, primarily in isolated tests. */
  persistence?: ActivityJobPersistence | null;
};

/**
 * Build and start the process-wide activity import job system.
 * Safe to call once at server boot; subsequent calls are no-ops.
 */
export const startActivityJobs = async (
  options: StartActivityJobsOptions = {},
): Promise<ActivityJobSystem> => {
  if (system) return system;

  system = await createActivityJobSystem({
    persistence:
      options.persistence === undefined ? createActivityJobPersistence() : options.persistence ?? undefined,
    handlers: {
      geocodeActivity,
      matchActivity: matchActivityAgainstAllSegments,
      warmPreview: async (activityId) => {
        await warmActivityPreviewImage(activityId);
      },
      onGeocodeFailed: logGeocodeFailure,
      onMatchFailed: (activityId, error) => {
        logMatchFailure("activity", activityId, error);
      },
      onPreviewFailed: logPreviewFailure,
    },
  });

  return system;
};

/** Flush pending work and stop workers (call on process shutdown). */
export const stopActivityJobs = async (): Promise<void> => {
  if (!system) return;
  const current = system;
  system = null;
  // Stop claiming new work and persist all lifecycle updates. Pending durable
  // rows are recovered on the next boot instead of delaying shutdown forever.
  await current.stop();
};

/**
 * Enqueue durable geocode + match + preview for a newly saved activity.
 * Scripts/tests that skip server boot retain the previous best-effort fallback.
 */
export const scheduleActivityImported = async (activityId: number): Promise<void> => {
  if (system) {
    await system.publishActivityImported(activityId);
    return;
  }

  void geocodeActivity(activityId).catch((error) => logGeocodeFailure(activityId, error));
  void matchActivityAgainstAllSegments(activityId).catch((error) =>
    logMatchFailure("activity", activityId, error),
  );
  void warmActivityPreviewImage(activityId).catch((error) => logPreviewFailure(activityId, error));
};

export const getActivityJobQueueStatus = (): ActivityJobQueueStatus =>
  system?.jobQueueStatus() ?? emptyJobQueueStatus();

/** Test helper: replace or clear the process-wide system. */
export const setActivityJobSystemForTests = (
  next: ActivityJobSystem | null,
): void => {
  system = next;
};
