/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import {
  geoPointSelect,
  geoPointSql,
  mapSegmentRow,
  mapTrackPointRow,
  pushGeoPoint,
} from "../db/geoPoint.js";
import { insertInBatches } from "../db/batchInsert.js";
import { query } from "../db/pool.js";
import { NotFoundError } from "../middleware/errors.js";
import type { SegmentPassResult, TrackPointRow } from "./segmentMatcher.js";

export type SegmentRow = {
  id: number;
  name: string;
  description: string | null;
  source_activity_id: number;
  start_index: number;
  end_index: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m: number;
  match_threshold: number;
  location: string | null;
  tags: string[] | null;
  match_activity_count?: number;
  matched_last_30d?: number;
  last_matched_at?: string | null;
};

export type ActivitySegmentContext = {
  location: string | null;
  sport: string | null;
};

export type PersistSegmentInput = {
  name: string;
  description?: string | null;
  source_activity_id: number;
  start_index: number;
  end_index: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m: number;
  match_threshold: number;
  location: string | null;
  tags: string[];
};

export const loadActivitySegmentContext = async (
  activityId: number,
): Promise<ActivitySegmentContext> => {
  const activity = await query<ActivitySegmentContext>(
    `SELECT location, sport FROM activities WHERE id = $1`,
    [activityId],
  );
  if (!activity.rowCount) throw new NotFoundError("Source activity not found");
  return activity.rows[0];
};

export const loadActivityPoints = async (activityId: number): Promise<TrackPointRow[]> => {
  const result = await query<{
    pt_lat: number;
    pt_lon: number;
    pt_elevation_m: number | null;
    heart_rate: number | null;
    speed_mps: number | null;
    timestamp: string | null;
  }>(
    `SELECT ${geoPointSelect("point", "pt")}, heart_rate, speed_mps, timestamp
     FROM track_points WHERE activity_id = $1 ORDER BY sequence`,
    [activityId],
  );
  return result.rows.map((row) =>
    mapTrackPointRow({
      lat: row.pt_lat,
      lon: row.pt_lon,
      elevation_m: row.pt_elevation_m,
      heart_rate: row.heart_rate,
      speed_mps: row.speed_mps,
      timestamp: row.timestamp,
    }),
  );
};

export const loadSegment = async (segmentId: number): Promise<SegmentRow | null> => {
  const result = await query<Record<string, unknown>>(`SELECT * FROM segments WHERE id = $1`, [
    segmentId,
  ]);
  const row = result.rows[0];
  return row ? (mapSegmentRow(row) as SegmentRow) : null;
};

export const listAllSegments = async (
  profileId?: number | "all" | null,
): Promise<SegmentRow[]> => {
  const scopeProfileId =
    profileId != null && profileId !== "all" ? profileId : null;

  const result = await query<Record<string, unknown>>(
    `SELECT s.*,
            COALESCE(stats.match_activity_count, 0) AS match_activity_count,
            COALESCE(stats.matched_last_30d, 0) AS matched_last_30d,
            stats.last_matched_at
     FROM segments s
     LEFT JOIN LATERAL (
       SELECT
         COUNT(DISTINCT m.activity_id)::int AS match_activity_count,
         COUNT(DISTINCT m.activity_id) FILTER (
           WHERE COALESCE(a.started_at, a.created_at) >= NOW() - INTERVAL '30 days'
         )::int AS matched_last_30d,
         MAX(COALESCE(a.started_at, a.created_at)) AS last_matched_at
       FROM activity_segment_matches m
       JOIN activities a ON a.id = m.activity_id
       WHERE m.segment_id = s.id
         AND ($1::int IS NULL OR a.profile_id = $1)
     ) stats ON true
     ORDER BY s.created_at DESC`,
    [scopeProfileId],
  );

  return result.rows.map((row) => {
    const mapped = mapSegmentRow(row) as SegmentRow & {
      match_activity_count?: unknown;
      matched_last_30d?: unknown;
      last_matched_at?: unknown;
    };
    const lastMatched = mapped.last_matched_at;
    return {
      ...mapped,
      match_activity_count: Number(mapped.match_activity_count ?? 0),
      matched_last_30d: Number(mapped.matched_last_30d ?? 0),
      last_matched_at:
        lastMatched == null || lastMatched === ""
          ? null
          : new Date(String(lastMatched)).toISOString(),
    };
  });
};

/** Activities that may enter segment start then end gates (necessary condition for matching). */
export const listActivityIdsOverlappingSegment = async (
  segmentId: number,
  excludeActivityId?: number,
): Promise<number[]> => {
  const result = await query<{ activity_id: number }>(
    `SELECT tp.activity_id
     FROM track_points tp
     JOIN activities a ON a.id = tp.activity_id AND a.point_count >= 2
     JOIN segments_with_gate_bounds sg ON sg.id = $1
     WHERE ($2::int IS NULL OR tp.activity_id != $2)
       AND tp.lat BETWEEN sg.union_min_lat AND sg.union_max_lat
       AND tp.lon BETWEEN sg.union_min_lon AND sg.union_max_lon
     GROUP BY tp.activity_id
     HAVING
       MIN(tp.sequence) FILTER (
         WHERE tp.lat BETWEEN sg.start_gate_min_lat AND sg.start_gate_max_lat
           AND tp.lon BETWEEN sg.start_gate_min_lon AND sg.start_gate_max_lon
       ) < MAX(tp.sequence) FILTER (
         WHERE tp.lat BETWEEN sg.end_gate_min_lat AND sg.end_gate_max_lat
           AND tp.lon BETWEEN sg.end_gate_min_lon AND sg.end_gate_max_lon
       )`,
    [segmentId, excludeActivityId ?? null],
  );
  return result.rows.map((row) => row.activity_id);
};

/** Segments whose gates an activity track could pass through in order. */
export const listSegmentsOverlappingActivity = async (
  activityId: number,
): Promise<SegmentRow[]> => {
  const result = await query<Record<string, unknown>>(
    `SELECT s.*
     FROM segments s
     JOIN segments_with_gate_bounds sg ON sg.id = s.id
     CROSS JOIN LATERAL (
       SELECT
         MIN(tp.sequence) FILTER (
           WHERE tp.lat BETWEEN sg.start_gate_min_lat AND sg.start_gate_max_lat
             AND tp.lon BETWEEN sg.start_gate_min_lon AND sg.start_gate_max_lon
         ) AS min_start_seq,
         MAX(tp.sequence) FILTER (
           WHERE tp.lat BETWEEN sg.end_gate_min_lat AND sg.end_gate_max_lat
             AND tp.lon BETWEEN sg.end_gate_min_lon AND sg.end_gate_max_lon
         ) AS max_end_seq
       FROM track_points tp
       WHERE tp.activity_id = $1
     ) gate
     WHERE gate.min_start_seq IS NOT NULL
       AND gate.max_end_seq IS NOT NULL
       AND gate.min_start_seq < gate.max_end_seq
     ORDER BY s.created_at DESC`,
    [activityId],
  );
  return result.rows.map((row) => mapSegmentRow(row) as SegmentRow);
};

const REF_POINT_PARAMS = 5;

export const saveReferencePoints = async (segmentId: number, points: TrackPointRow[]) => {
  if (!points.length) return;

  await insertInBatches(points.length, REF_POINT_PARAMS, async (start, end) => {
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let param = 1;

    for (let i = start; i < end; i++) {
      const point = points[i];
      values.push(segmentId, i);
      pushGeoPoint(values, {
        lat: point.lat,
        lon: point.lon,
        elevation_m: point.elevation_m,
      });
      placeholders.push(`($${param}, $${param + 1}, ${geoPointSql(param + 2)})`);
      param += REF_POINT_PARAMS;
    }

    await query(
      `INSERT INTO segment_reference_points (segment_id, sequence, point)
       VALUES ${placeholders.join(", ")}`,
      values,
    );
  });
};

export const deleteReferencePoints = async (segmentId: number) => {
  await query(`DELETE FROM segment_reference_points WHERE segment_id = $1`, [segmentId]);
};

export const loadReferencePoints = async (segmentId: number): Promise<TrackPointRow[]> => {
  const result = await query<{
    pt_lat: number;
    pt_lon: number;
    pt_elevation_m: number | null;
  }>(
    `SELECT ${geoPointSelect("point", "pt")}
     FROM segment_reference_points WHERE segment_id = $1 ORDER BY sequence`,
    [segmentId],
  );
  return result.rows.map((row) =>
    mapTrackPointRow({
      lat: row.pt_lat,
      lon: row.pt_lon,
      elevation_m: row.pt_elevation_m,
      heart_rate: null,
      speed_mps: null,
      timestamp: null,
    }),
  );
};

const MATCH_PARAMS = 13;

export const insertMatches = async (
  segmentId: number,
  activityId: number,
  passes: SegmentPassResult[],
) => {
  if (!passes.length) return;

  await insertInBatches(passes.length, MATCH_PARAMS, async (start, end) => {
    const values: unknown[] = [];
    const placeholders = passes.slice(start, end).map((pass, i) => {
      const base = i * MATCH_PARAMS;
      values.push(
        segmentId,
        activityId,
        pass.passNumber,
        pass.matchScore,
        pass.startIndex,
        pass.endIndex,
        pass.durationSec,
        pass.distanceM,
        pass.avgSpeedKmh,
        pass.maxSpeedKmh,
        pass.avgHr,
        pass.maxHr,
        pass.elevationGainM,
      );
      return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13})`;
    });

    await query(
      `INSERT INTO activity_segment_matches
        (segment_id, activity_id, pass_number, match_score, start_index, end_index,
         duration_sec, distance_m, avg_speed_kmh, max_speed_kmh, avg_hr, max_hr, elevation_gain_m)
       VALUES ${placeholders.join(", ")}`,
      values,
    );
  });
};

export const deleteMatchesForSegment = async (segmentId: number) => {
  await query(`DELETE FROM activity_segment_matches WHERE segment_id = $1`, [segmentId]);
};

export const deleteMatchesForSegmentActivity = async (
  segmentId: number,
  activityId: number,
) => {
  await query(`DELETE FROM activity_segment_matches WHERE segment_id = $1 AND activity_id = $2`, [
    segmentId,
    activityId,
  ]);
};

export const persistNewSegment = async (input: PersistSegmentInput) => {
  const segmentResult = await query<Record<string, unknown>>(
    `INSERT INTO segments
      (name, description, source_activity_id, start_index, end_index,
       start_point, end_point, radius_m, match_threshold, location, tags)
     VALUES ($1,$2,$3,$4,$5,${geoPointSql(6)},${geoPointSql(9)},$12,$13,$14,$15)
     RETURNING *`,
    [
      input.name,
      input.description ?? null,
      input.source_activity_id,
      input.start_index,
      input.end_index,
      input.start_lat,
      input.start_lon,
      null,
      input.end_lat,
      input.end_lon,
      null,
      input.radius_m,
      input.match_threshold,
      input.location,
      input.tags,
    ],
  );

  return mapSegmentRow(segmentResult.rows[0]) as SegmentRow;
};

export const updateSegmentRow = async (
  segmentId: number,
  fields: {
    name: string;
    description: string | null;
    start_index: number;
    end_index: number;
    start_lat: number;
    start_lon: number;
    end_lat: number;
    end_lon: number;
    radius_m: number;
    match_threshold: number;
  },
) => {
  const updatedResult = await query<Record<string, unknown>>(
    `UPDATE segments SET
      name = $2,
      description = $3,
      start_index = $4,
      end_index = $5,
      start_point = ${geoPointSql(6)},
      end_point = ${geoPointSql(9)},
      radius_m = $12,
      match_threshold = $13
     WHERE id = $1
     RETURNING *`,
    [
      segmentId,
      fields.name,
      fields.description,
      fields.start_index,
      fields.end_index,
      fields.start_lat,
      fields.start_lon,
      null,
      fields.end_lat,
      fields.end_lon,
      null,
      fields.radius_m,
      fields.match_threshold,
    ],
  );
  return mapSegmentRow(updatedResult.rows[0]) as SegmentRow;
};

export const deleteSegmentRow = async (segmentId: number): Promise<boolean> => {
  const result = await query(`DELETE FROM segments WHERE id = $1 RETURNING id`, [segmentId]);
  return (result.rowCount ?? 0) > 0;
};

export const getSegmentReferencePoints = async (segmentId: number) => {
  const points = await loadReferencePoints(segmentId);
  return points.map(({ lat, lon, elevation_m }) => ({ lat, lon, elevation_m }));
};
