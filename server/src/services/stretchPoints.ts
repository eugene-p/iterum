/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { query } from "../db/pool.js";
import { BadRequestError } from "../middleware/errors.js";
import { loadActivityPoints, loadReferencePoints } from "./segmentRepository.js";
import type { StretchPoint } from "./stretchSegmentation.js";

const toStretchPoints = (
  points: Array<{ lat: number; lon: number; elevation_m: number | null }>,
): StretchPoint[] =>
  points.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    elevation_m: point.elevation_m,
  }));

export const stretchPointsFromReference = async (segmentId: number): Promise<StretchPoint[]> => {
  const reference = await loadReferencePoints(segmentId);
  return toStretchPoints(reference);
};

export const stretchPointsFromActivityPass = async (
  segmentId: number,
  activityId: number,
): Promise<StretchPoint[]> => {
  const match = await query<{
    start_index: number;
    end_index: number;
  }>(
    `SELECT start_index, end_index
     FROM activity_segment_matches
     WHERE segment_id = $1 AND activity_id = $2
     ORDER BY pass_number
     LIMIT 1`,
    [segmentId, activityId],
  );
  if (!match.rowCount) {
    throw new BadRequestError(
      `Activity ${activityId} has no matched pass on segment ${segmentId}`,
    );
  }

  const points = await loadActivityPoints(activityId);
  const { start_index, end_index } = match.rows[0];
  return toStretchPoints(points.slice(start_index, end_index + 1));
};

export const loadFirstMatchedActivityId = async (segmentId: number): Promise<number | null> => {
  const result = await query<{ activity_id: number }>(
    `SELECT m.activity_id
     FROM activity_segment_matches m
     JOIN activities a ON a.id = m.activity_id
     WHERE m.segment_id = $1
     ORDER BY COALESCE(a.started_at, a.created_at) DESC, m.activity_id DESC, m.pass_number ASC
     LIMIT 1`,
    [segmentId],
  );
  return result.rows[0]?.activity_id ?? null;
};
