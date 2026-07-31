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

export const isActivityJobWorkDrained = (status: ActivityJobQueueStatus): boolean =>
  Object.values(status.work).every((queue) => queue.pending + queue.active === 0);

export const activityJobDlqFailureCount = (status: ActivityJobQueueStatus): number =>
  status.dlq.geocode + status.dlq.match + status.dlq.preview;
