import { query } from "../db/pool.js";
import { utcDateFromPgDate, type UtcDate } from "../util/utcDate.js";

export type BaselinePair = { profileId: number; segmentId: number };

export type ActivityBaselineContext = {
  profileId: number | null;
  activityDate: UtcDate;
  segmentIds: number[];
};

export const listPairsForSegment = async (segmentId: number): Promise<BaselinePair[]> => {
  const result = await query<{ profile_id: number; segment_id: number }>(
    `SELECT DISTINCT a.profile_id, m.segment_id
     FROM activity_segment_matches m
     JOIN activities a ON a.id = m.activity_id
     WHERE m.segment_id = $1
       AND a.profile_id IS NOT NULL
     ORDER BY a.profile_id, m.segment_id`,
    [segmentId],
  );
  return result.rows.map((row) => ({ profileId: row.profile_id, segmentId: row.segment_id }));
};

export const listSegmentIdsForActivity = async (activityId: number): Promise<number[]> => {
  const result = await query<{ segment_id: number }>(
    `SELECT DISTINCT segment_id
     FROM activity_segment_matches
     WHERE activity_id = $1
     ORDER BY segment_id`,
    [activityId],
  );
  return result.rows.map((row) => row.segment_id);
};

export const listPairsForActivity = async (
  activityId: number,
): Promise<ActivityBaselineContext | null> => {
  const activity = await query<{ profile_id: number | null; activity_date: UtcDate | Date }>(
    `SELECT profile_id,
            (COALESCE(started_at, created_at) AT TIME ZONE 'UTC')::date AS activity_date
     FROM activities
     WHERE id = $1`,
    [activityId],
  );
  if (!activity.rowCount) return null;

  const matches = await listSegmentIdsForActivity(activityId);
  return {
    profileId: activity.rows[0].profile_id,
    activityDate: utcDateFromPgDate(activity.rows[0].activity_date),
    segmentIds: matches,
  };
};

export const uniqueBaselinePairs = (
  pairs: ReadonlyArray<BaselinePair>,
): BaselinePair[] =>
  [...new Map(
    pairs.map((pair) => [`${pair.profileId}:${pair.segmentId}`, pair] as const),
  ).values()].sort((a, b) => a.profileId - b.profileId || a.segmentId - b.segmentId);
