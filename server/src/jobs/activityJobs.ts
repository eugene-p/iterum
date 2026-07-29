import { geocodeActivity } from "../services/geocodeActivity.js";
import { warmActivityPreviewImage } from "../services/routePreview/routePreviewService.js";
import {
  logMatchFailure,
  matchActivityAgainstAllSegments,
} from "../services/segmentMatching.js";
import {
  createActivityJobSystem,
  type ActivityJobSystem,
} from "./createActivityJobSystem.js";

let system: ActivityJobSystem | null = null;

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

/**
 * Build and start the process-wide activity import job system.
 * Safe to call once at server boot; subsequent calls are no-ops.
 */
export const startActivityJobs = async (): Promise<ActivityJobSystem> => {
  if (system) return system;

  system = await createActivityJobSystem({
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
  // Drain already-queued work while pumps still run, then stop.
  await current.flushAll();
  current.stop();
};

/**
 * Enqueue best-effort geocode + match + preview for a newly saved activity.
 * Falls back to direct fire-and-forget when the job system is not started
 * (scripts/tests that skip server boot).
 */
export const scheduleActivityImported = (activityId: number): void => {
  if (system) {
    system.publishActivityImported(activityId);
    return;
  }

  void geocodeActivity(activityId).catch((error) =>
    logGeocodeFailure(activityId, error),
  );
  void matchActivityAgainstAllSegments(activityId).catch((error) =>
    logMatchFailure("activity", activityId, error),
  );
  void warmActivityPreviewImage(activityId).catch((error) =>
    logPreviewFailure(activityId, error),
  );
};

/** Test helper: replace or clear the process-wide system. */
export const setActivityJobSystemForTests = (
  next: ActivityJobSystem | null,
): void => {
  system = next;
};
