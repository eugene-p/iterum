/** Topic published after an activity is committed to the database. */
export const ACTIVITY_IMPORTED_TOPIC = "activity.imported" as const;

export type ActivityImportedPayload = {
  activityId: number;
};

export const ACTIVITY_JOB_QUEUES = {
  geocode: "geocode",
  match: "match",
  preview: "preview",
} as const;

/** Retries after the first geocode attempt (Photon / network). */
export const GEOCODE_WORKER_RETRIES = 2;

export const GEOCODE_RETRY_INITIAL_DELAY_MS = 200;
export const GEOCODE_RETRY_MAX_DELAY_MS = 30_000;

export const ACTIVITY_JOB_TIMEOUT_MS = {
  geocode: 60_000,
  match: 300_000,
  preview: 120_000,
} as const;

export type ActivityJobQueueName =
  (typeof ACTIVITY_JOB_QUEUES)[keyof typeof ACTIVITY_JOB_QUEUES];
