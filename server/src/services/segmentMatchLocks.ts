import { query } from "../db/pool.js";

const assertPositive = (value: number, name: string): void => {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
};

export const lockActivityMatchMutation = async (activityId: number): Promise<void> => {
  assertPositive(activityId, "activityId");
  await query("SELECT pg_advisory_xact_lock($1::int, $2::int)", [-1, activityId]);
};

export const lockSegmentMatchMutation = async (segmentId: number): Promise<void> => {
  assertPositive(segmentId, "segmentId");
  await query("SELECT pg_advisory_xact_lock($1::int, $2::int)", [-2, segmentId]);
};

export const lockBaselinePair = async (profileId: number, segmentId: number): Promise<void> => {
  assertPositive(profileId, "profileId");
  assertPositive(segmentId, "segmentId");
  await query("SELECT pg_advisory_xact_lock($1::int, $2::int)", [profileId, segmentId]);
};

export const lockSegmentIds = async (segmentIds: ReadonlyArray<number>): Promise<void> => {
  for (const segmentId of [...new Set(segmentIds)].sort((a, b) => a - b)) {
    await lockSegmentMatchMutation(segmentId);
  }
};
