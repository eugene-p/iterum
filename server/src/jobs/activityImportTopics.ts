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

/** In-call retries after the first geocode attempt (Photon / network). */
export const GEOCODE_WORKER_RETRIES = 2;

export type ActivityJobQueueName =
  (typeof ACTIVITY_JOB_QUEUES)[keyof typeof ACTIVITY_JOB_QUEUES];
