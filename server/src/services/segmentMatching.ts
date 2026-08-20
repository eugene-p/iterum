/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { BadRequestError, NotFoundError } from "../middleware/errors.js";
import { query, withTransaction } from "../db/pool.js";
import { utcDateFromPgDate, type UtcDate } from "../util/utcDate.js";
import { MATCH_LOAD_CONCURRENCY, mapPool } from "../util/concurrency.js";
import {
  buildPassResult,
  findAllSegmentPasses,
  type SegmentDefinition,
  type SegmentPassResult,
  type TrackPointRow,
} from "./segmentMatcher.js";
import {
  deleteMatchesForSegment,
  deleteMatchesForSegmentActivity,
  insertMatches,
  listActivityIdsOverlappingSegment,
  listSegmentsOverlappingActivity,
  loadActivityPoints,
  loadReferencePoints,
  loadSegment,
} from "./segmentRepository.js";
import { rebuildSegmentBaselines } from "./segmentBaselineAggregator.js";
import { listPairsForSegment, uniqueBaselinePairs } from "./segmentBaselinePairs.js";
import { lockActivityMatchMutation, lockSegmentIds, lockSegmentMatchMutation } from "./segmentMatchLocks.js";

export const toSegmentDefinition = (row: {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m: number;
  match_threshold: number;
}): SegmentDefinition => ({
  start_lat: row.start_lat,
  start_lon: row.start_lon,
  end_lat: row.end_lat,
  end_lon: row.end_lon,
  radius_m: row.radius_m,
  match_threshold: row.match_threshold,
});

type ComputedPasses = {
  activityId: number;
  passes: SegmentPassResult[];
};

export type ActivityMatchWriteResult = {
  profileId: number | null;
  activityDate: UtcDate;
  insertedSegmentIds: ReadonlyArray<number>;
  clearedSegmentIds: ReadonlyArray<number>;
};

type ActivitySegmentWrite = {
  segmentId: number;
  passes: SegmentPassResult[];
};

export type PreparedActivityMatchWrites = {
  profileId: number | null;
  activityDate: UtcDate;
  writes: ReadonlyArray<ActivitySegmentWrite>;
};

const computePassesForActivity = async (
  activityId: number,
  definition: SegmentDefinition,
  referencePoints: TrackPointRow[],
  points?: TrackPointRow[],
): Promise<ComputedPasses | null> => {
  const track = points ?? (await loadActivityPoints(activityId));
  if (track.length < 2) return null;
  const passes = findAllSegmentPasses(track, definition, referencePoints);
  if (!passes.length) return null;
  return { activityId, passes };
};

export const rematchSegment = async (
  segmentId: number,
  definition: SegmentDefinition,
  referencePoints: TrackPointRow[],
) => {
  if (referencePoints.length < 2) {
    throw new BadRequestError("Segment has no reference path");
  }

  const activityIds = await listActivityIdsOverlappingSegment(segmentId);

  // Load + match off the transaction connection (pool concurrency is safe).
  const computed = await mapPool(activityIds, MATCH_LOAD_CONCURRENCY, (activityId) =>
    computePassesForActivity(activityId, definition, referencePoints),
  );

  await withTransaction(async () => {
    await lockSegmentMatchMutation(segmentId);
    const before = await listPairsForSegment(segmentId);
    await deleteMatchesForSegment(segmentId);
    for (const result of computed) {
      if (result) {
        await insertMatches(segmentId, result.activityId, result.passes);
      }
    }
    const after = await listPairsForSegment(segmentId);
    for (const pair of uniqueBaselinePairs([...before, ...after])) {
      await rebuildSegmentBaselines(pair);
    }
  });

  return { rescanned: activityIds.length };
};

export const rescanSegment = async (segmentId: number) => {
  const segment = await loadSegment(segmentId);
  if (!segment) throw new NotFoundError("Segment not found");
  const reference = await loadReferencePoints(segmentId);
  return rematchSegment(segmentId, toSegmentDefinition(segment), reference);
};

export type MatchSegmentContext = {
  segmentId: number;
  sourceActivityId: number;
  definition: SegmentDefinition;
  referencePoints: TrackPointRow[];
  sourcePassIndices?: { start_index: number; end_index: number };
};

const computeSourceActivityPasses = async (
  sourceActivityId: number,
  definition: SegmentDefinition,
  referencePoints: TrackPointRow[],
  sourcePassIndices?: { start_index: number; end_index: number },
): Promise<ComputedPasses | null> => {
  const sourcePoints = await loadActivityPoints(sourceActivityId);
  if (sourcePoints.length < 2) return null;

  const canUseDirectSourceSlice =
    sourcePassIndices != null && sourcePassIndices.start_index < sourcePassIndices.end_index;

  if (canUseDirectSourceSlice) {
    const sourceSlice = sourcePoints.slice(
      sourcePassIndices.start_index,
      sourcePassIndices.end_index + 1,
    );
    if (sourceSlice.length >= 2) {
      return {
        activityId: sourceActivityId,
        passes: [
          buildPassResult({
            slice: sourceSlice,
            startIndex: sourcePassIndices.start_index,
            endIndex: sourcePassIndices.end_index,
            passNumber: 1,
            matchScore: 1,
          }),
        ],
      };
    }
  }

  return computePassesForActivity(
    sourceActivityId,
    definition,
    referencePoints,
    sourcePoints,
  );
};

export const matchSegmentAcrossActivities = async ({
  segmentId,
  sourceActivityId,
  definition,
  referencePoints,
  sourcePassIndices,
}: MatchSegmentContext) => {
  const sourceResult = await computeSourceActivityPasses(
    sourceActivityId,
    definition,
    referencePoints,
    sourcePassIndices,
  );

  const otherActivityIds = await listActivityIdsOverlappingSegment(
    segmentId,
    sourceActivityId,
  );

  const otherResults = await mapPool(otherActivityIds, MATCH_LOAD_CONCURRENCY, (activityId) =>
    computePassesForActivity(activityId, definition, referencePoints),
  );

  await withTransaction(async () => {
    await lockSegmentMatchMutation(segmentId);
    if (sourceResult) {
      await insertMatches(segmentId, sourceResult.activityId, sourceResult.passes);
    }
    for (const result of otherResults) {
      if (result) {
        await insertMatches(segmentId, result.activityId, result.passes);
      }
    }
    const pairs = await listPairsForSegment(segmentId);
    for (const pair of pairs) await rebuildSegmentBaselines(pair);
  });
};

export const computeActivityMatchWrites = async (
  activityId: number,
): Promise<PreparedActivityMatchWrites> => {
  const activity = await query<{ profile_id: number | null; activity_date: UtcDate | Date }>(
    `SELECT profile_id,
            (COALESCE(started_at, created_at) AT TIME ZONE 'UTC')::date AS activity_date
     FROM activities WHERE id = $1`,
    [activityId],
  );
  if (!activity.rowCount) throw new NotFoundError("Activity not found");

  const points = await loadActivityPoints(activityId);
  if (points.length < 2) {
    return {
      profileId: activity.rows[0].profile_id,
      activityDate: utcDateFromPgDate(activity.rows[0].activity_date),
      writes: [],
    };
  }

  const segments = await listSegmentsOverlappingActivity(activityId);

  const writes = await mapPool(segments, MATCH_LOAD_CONCURRENCY, async (segment) => {
    const reference = await loadReferencePoints(segment.id);
    if (reference.length < 2) return null;
    const definition = toSegmentDefinition(segment);
    const passes = findAllSegmentPasses(points, definition, reference);
    return { segmentId: segment.id, passes } satisfies ActivitySegmentWrite;
  });

  return {
    profileId: activity.rows[0].profile_id,
    activityDate: utcDateFromPgDate(activity.rows[0].activity_date),
    writes: writes.filter((write): write is ActivitySegmentWrite => write != null),
  };
};

export const applyActivityMatchWrites = async (
  activityId: number,
  prepared: PreparedActivityMatchWrites,
): Promise<ActivityMatchWriteResult> => {
  const insertedSegmentIds: number[] = [];
  const clearedSegmentIds: number[] = [];

  for (const write of prepared.writes) {
    await deleteMatchesForSegmentActivity(write.segmentId, activityId);
    if (write.passes.length) {
      insertedSegmentIds.push(write.segmentId);
      await insertMatches(write.segmentId, activityId, write.passes);
    } else {
      clearedSegmentIds.push(write.segmentId);
    }
  }

  return {
    profileId: prepared.profileId,
    activityDate: prepared.activityDate,
    insertedSegmentIds,
    clearedSegmentIds,
  };
};

export const matchActivityAgainstAllSegments = async (
  activityId: number,
): Promise<ActivityMatchWriteResult> => {
  const prepared = await computeActivityMatchWrites(activityId);
  return withTransaction(async () => {
    await lockActivityMatchMutation(activityId);
    await lockSegmentIds(prepared.writes.map((write) => write.segmentId));
    return applyActivityMatchWrites(activityId, prepared);
  });
};

export const logMatchFailure = (context: string, id: number, error: unknown): void => {
  console.error(
    `Segment matching failed (${context} #${id}):`,
    error instanceof Error ? error.message : error,
  );
};
