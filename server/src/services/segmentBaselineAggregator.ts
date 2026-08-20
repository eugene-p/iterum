import { query, withTransaction } from "../db/pool.js";
import { BadRequestError, NotFoundError } from "../middleware/errors.js";
import { addUtcDays, utcDateFromPgDate, type UtcDate } from "../util/utcDate.js";
import {
  assertKnownSegmentAggregationTypes,
  listSegmentAggregators,
} from "./segmentBaselineRegistry.js";
import {
  createDurationIndex,
  createDurationStatsAccumulator,
  type DurationBaselineStats,
  type DurationObservation,
  type SegmentAggregator,
} from "./segmentBaselineStats.js";
import { lockBaselinePair } from "./segmentMatchLocks.js";
import {
  applyActivityMatchWrites,
  computeActivityMatchWrites,
  type ActivityMatchWriteResult,
} from "./segmentMatching.js";
import { lockActivityMatchMutation, lockSegmentIds } from "./segmentMatchLocks.js";

const VALID_OBSERVATION_SQL = `
  m.duration_sec IS NOT NULL
  AND m.duration_sec > 0
  AND m.duration_sec < 'Infinity'::double precision
`;

export const validSegmentObservationSql = VALID_OBSERVATION_SQL;
const SEGMENT_BASELINE_UPSERT_CHUNK_SIZE = 250;

type BaselineRow = DurationBaselineStats & {
  profileId: number;
  segmentId: number;
  aggregationType: string;
  asOfDate: UtcDate;
};

const loadObservations = async (
  profileId: number,
  segmentId: number,
): Promise<DurationObservation[]> => {
  const result = await query<{ as_of_date: UtcDate | Date; duration_sec: number }>(
    `SELECT
       (COALESCE(a.started_at, a.created_at) AT TIME ZONE 'UTC')::date AS as_of_date,
       m.duration_sec
     FROM activity_segment_matches m
     JOIN activities a ON a.id = m.activity_id
     WHERE m.segment_id = $1
       AND a.profile_id = $2
       AND ${VALID_OBSERVATION_SQL}
     ORDER BY as_of_date ASC, m.id ASC`,
    [segmentId, profileId],
  );
  return result.rows.map((row) => ({
    date: utcDateFromPgDate(row.as_of_date),
    durationSec: Number(row.duration_sec),
  }));
};

const sweep = (
  observations: ReadonlyArray<DurationObservation>,
  aggregators: ReadonlyArray<SegmentAggregator>,
  options: { fromDate?: UtcDate | null; asOfDate?: UtcDate; mode: "full" | "as_of" },
): BaselineRow[] => {
  if (!observations.length) return [];

  const index = createDurationIndex(observations.map((observation) => observation.durationSec));
  const accumulators = aggregators.map((aggregator) => ({
    aggregator,
    accumulator: createDurationStatsAccumulator(index),
    left: 0,
  }));
  const emitted: BaselineRow[] = [];

  for (let i = 0; i < observations.length; ) {
    const asOfDate = observations[i].date;
    if (options.mode === "as_of" && options.asOfDate != null && asOfDate > options.asOfDate) break;

    let end = i + 1;
    while (end < observations.length && observations[end].date === asOfDate) end += 1;

    for (const entry of accumulators) {
      if (entry.aggregator.window.kind !== "rolling_days") continue;
      const start = addUtcDays(asOfDate, -(entry.aggregator.window.days - 1));
      while (entry.left < i && observations[entry.left].date < start) {
        entry.accumulator.remove(observations[entry.left].durationSec);
        entry.left += 1;
      }
    }

    for (let cursor = i; cursor < end; cursor += 1) {
      for (const entry of accumulators) entry.accumulator.add(observations[cursor].durationSec);
    }

    const shouldEmit =
      options.mode === "as_of"
        ? asOfDate === options.asOfDate
        : options.fromDate == null || asOfDate >= options.fromDate;
    if (shouldEmit) {
      for (const entry of accumulators) {
        emitted.push({
          profileId: 0,
          segmentId: 0,
          aggregationType: entry.aggregator.type,
          asOfDate,
          ...entry.accumulator.snapshot(),
        });
      }
    }
    i = end;
  }
  return emitted;
};

const deleteSnapshots = async (
  profileId: number,
  segmentId: number,
  scope: { kind: "all" | "date" | "from" | "types"; date?: UtcDate; types?: ReadonlyArray<string> },
): Promise<void> => {
  if (scope.kind === "all") {
    await query(`DELETE FROM segment_baselines WHERE profile_id = $1 AND segment_id = $2`, [
      profileId,
      segmentId,
    ]);
  } else if (scope.kind === "date") {
    await query(
      `DELETE FROM segment_baselines
       WHERE profile_id = $1 AND segment_id = $2 AND as_of_date = $3`,
      [profileId, segmentId, scope.date],
    );
  } else if (scope.kind === "from") {
    await query(
      `DELETE FROM segment_baselines
       WHERE profile_id = $1 AND segment_id = $2 AND as_of_date >= $3`,
      [profileId, segmentId, scope.date],
    );
  } else {
    await query(
      `DELETE FROM segment_baselines
       WHERE profile_id = $1 AND segment_id = $2 AND aggregation_type = ANY($3::text[])`,
      [profileId, segmentId, scope.types],
    );
  }
};

const persistRows = async (rows: ReadonlyArray<BaselineRow>): Promise<void> => {
  for (let start = 0; start < rows.length; start += SEGMENT_BASELINE_UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(start, start + SEGMENT_BASELINE_UPSERT_CHUNK_SIZE);
    const values: unknown[] = [];
    const placeholders = chunk.map((row, index) => {
      const offset = index * 7;
      values.push(
        row.profileId,
        row.segmentId,
        row.aggregationType,
        row.asOfDate,
        row.sample_count,
        row.typical_duration_sec,
        row.best_duration_sec,
      );
      return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7})`;
    });
    await query(
      `INSERT INTO segment_baselines
        (profile_id, segment_id, aggregation_type, as_of_date, sample_count,
         typical_duration_sec, best_duration_sec)
       VALUES ${placeholders.join(",")}
       ON CONFLICT (profile_id, segment_id, aggregation_type, as_of_date)
       DO UPDATE SET sample_count = EXCLUDED.sample_count,
                     typical_duration_sec = EXCLUDED.typical_duration_sec,
                     best_duration_sec = EXCLUDED.best_duration_sec,
                     computed_at = NOW()`,
      values,
    );
  }
};

const rebuildInTransaction = async (input: {
  profileId: number;
  segmentId: number;
  fromDate?: UtcDate | null;
  aggregationTypes?: ReadonlyArray<string>;
}): Promise<void> => {
  const aggregators = input.aggregationTypes
    ? assertKnownSegmentAggregationTypes(input.aggregationTypes)
    : listSegmentAggregators();
  if (input.aggregationTypes && input.fromDate != null) {
    throw new Error("aggregationTypes cannot be combined with fromDate");
  }

  await lockBaselinePair(input.profileId, input.segmentId);
  const observations = await loadObservations(input.profileId, input.segmentId);
  const rows = sweep(observations, aggregators, { mode: "full", fromDate: input.fromDate });
  const hydrated = rows.map((row) => ({
    ...row,
    profileId: input.profileId,
    segmentId: input.segmentId,
  }));

  if (input.fromDate != null) {
    await deleteSnapshots(input.profileId, input.segmentId, { kind: "from", date: input.fromDate });
  } else if (input.aggregationTypes) {
    await deleteSnapshots(input.profileId, input.segmentId, {
      kind: "types",
      types: aggregators.map((aggregator) => aggregator.type),
    });
  } else {
    await deleteSnapshots(input.profileId, input.segmentId, { kind: "all" });
  }
  await persistRows(hydrated);
};

export const rebuildSegmentBaselines = async (input: {
  profileId: number;
  segmentId: number;
  fromDate?: UtcDate | null;
  aggregationTypes?: ReadonlyArray<string>;
}): Promise<void> => withTransaction(() => rebuildInTransaction(input));

export const refreshSegmentBaselines = async (input: {
  profileId: number;
  segmentId: number;
  asOfDate: UtcDate;
  mode?: "as_of" | "as_of_and_later";
}): Promise<void> => {
  if (input.mode === "as_of_and_later") {
    return rebuildSegmentBaselines({
      profileId: input.profileId,
      segmentId: input.segmentId,
      fromDate: input.asOfDate,
    });
  }
  await withTransaction(async () => {
    await lockBaselinePair(input.profileId, input.segmentId);
    const observations = await loadObservations(input.profileId, input.segmentId);
    const rows = sweep(observations, listSegmentAggregators(), {
      mode: "as_of",
      asOfDate: input.asOfDate,
    }).map((row) => ({ ...row, profileId: input.profileId, segmentId: input.segmentId }));
    await deleteSnapshots(input.profileId, input.segmentId, { kind: "date", date: input.asOfDate });
    await persistRows(rows);
  });
};

const hasLaterSnapshot = async (
  profileId: number,
  segmentId: number,
  activityDate: UtcDate,
): Promise<boolean> => {
  const result = await query(
    `SELECT EXISTS(
       SELECT 1 FROM segment_baselines
       WHERE profile_id = $1 AND segment_id = $2 AND as_of_date > $3
     ) AS exists`,
    [profileId, segmentId, activityDate],
  );
  return Boolean(result.rows[0]?.exists);
};

/** Match one activity and refresh every affected profile × segment pair atomically. */
export const matchActivityAndRefreshBaselines = async (
  activityId: number,
): Promise<ActivityMatchWriteResult> => {
  const prepared = await computeActivityMatchWrites(activityId);
  return withTransaction(async () => {
    await lockActivityMatchMutation(activityId);
    await lockSegmentIds(prepared.writes.map((write) => write.segmentId));
    const result = await applyActivityMatchWrites(activityId, prepared);
    if (result.profileId == null) return result;

    const segmentIds = [...new Set([...result.insertedSegmentIds, ...result.clearedSegmentIds])]
      .sort((a, b) => a - b);
    for (const segmentId of segmentIds) {
      await lockBaselinePair(result.profileId, segmentId);
      const mode = (await hasLaterSnapshot(result.profileId, segmentId, result.activityDate))
        ? "as_of_and_later"
        : "as_of";
      await refreshSegmentBaselines({
        profileId: result.profileId,
        segmentId,
        asOfDate: result.activityDate,
        mode,
      });
    }
    return result;
  });
};

export type SegmentBaselinesResponse = {
  activity_id: number;
  activity_segment_match_id: number;
  pass_number: number;
  effort_sec: number;
  as_of_date: UtcDate;
  aggregations: Record<string, DurationBaselineStats>;
};

export const getSegmentBaselines = async (
  segmentId: number,
  input: {
    activity_id?: number;
    pass?: number;
    activity_segment_match_id?: number;
  },
): Promise<SegmentBaselinesResponse> => {
  const segment = await query(`SELECT 1 FROM segments WHERE id = $1`, [segmentId]);
  if (!segment.rowCount) throw new NotFoundError("Segment not found");
  if (input.pass != null && input.activity_id == null) {
    throw new BadRequestError("pass requires activity_id");
  }

  if (input.activity_segment_match_id != null) {
    const pinned = await query<{ activity_id: number; pass_number: number }>(
      `SELECT activity_id, pass_number
       FROM activity_segment_matches
       WHERE id = $1 AND segment_id = $2`,
      [input.activity_segment_match_id, segmentId],
    );
    if (
      pinned.rowCount &&
      ((input.activity_id != null && pinned.rows[0].activity_id !== input.activity_id) ||
        (input.pass != null && pinned.rows[0].pass_number !== input.pass))
    ) {
      throw new BadRequestError("Focal match parameters disagree");
    }
  }

  const filters = ["m.segment_id = $1", VALID_OBSERVATION_SQL, "a.profile_id IS NOT NULL"];
  const params: unknown[] = [segmentId];
  if (input.activity_id != null) {
    params.push(input.activity_id);
    filters.push(`m.activity_id = $${params.length}`);
  }
  if (input.pass != null) {
    params.push(input.pass);
    filters.push(`m.pass_number = $${params.length}`);
  }
  if (input.activity_segment_match_id != null) {
    params.push(input.activity_segment_match_id);
    filters.push(`m.id = $${params.length}`);
  }

  const focal = await query<{
    activity_id: number;
    activity_segment_match_id: number;
    pass_number: number;
    effort_sec: number;
    profile_id: number;
    as_of_date: UtcDate | Date;
  }>(
    `SELECT m.activity_id, m.id AS activity_segment_match_id, m.pass_number,
            m.duration_sec AS effort_sec, a.profile_id,
            (COALESCE(a.started_at, a.created_at) AT TIME ZONE 'UTC')::date AS as_of_date
     FROM activity_segment_matches m
     JOIN activities a ON a.id = m.activity_id
     WHERE ${filters.join(" AND ")}
     ORDER BY COALESCE(a.started_at, a.created_at) DESC, a.id DESC, m.pass_number DESC
     LIMIT 1`,
    params,
  );
  if (!focal.rowCount) throw new NotFoundError("No valid matched pass found");
  const selected = focal.rows[0];
  const snapshots = await query<{
    aggregation_type: string;
    sample_count: number;
    typical_duration_sec: number | null;
    best_duration_sec: number | null;
  }>(
    `SELECT aggregation_type, sample_count, typical_duration_sec, best_duration_sec
     FROM segment_baselines
     WHERE profile_id = $1 AND segment_id = $2 AND as_of_date = $3`,
    [selected.profile_id, segmentId, selected.as_of_date],
  );
  const saved = new Map(snapshots.rows.map((row) => [row.aggregation_type, row]));
  const aggregations = Object.fromEntries(
    listSegmentAggregators().map((aggregator) => {
      const row = saved.get(aggregator.type);
      return [
        aggregator.type,
        row
          ? {
              sample_count: Number(row.sample_count),
              typical_duration_sec: row.typical_duration_sec == null ? null : Number(row.typical_duration_sec),
              best_duration_sec: row.best_duration_sec == null ? null : Number(row.best_duration_sec),
            }
          : { sample_count: 0, typical_duration_sec: null, best_duration_sec: null },
      ];
    }),
  );
  return {
    activity_id: selected.activity_id,
    activity_segment_match_id: selected.activity_segment_match_id,
    pass_number: selected.pass_number,
    effort_sec: Number(selected.effort_sec),
    as_of_date: utcDateFromPgDate(selected.as_of_date),
    aggregations,
  };
};
