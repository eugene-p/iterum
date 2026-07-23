/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { geoPointSelect } from "../db/geoPoint.js";
import { query } from "../db/pool.js";

export type RouteSamplePoint = { lat: number; lon: number };

const mapLatLonRows = (rows: Array<{ pt_lat: number; pt_lon: number }>): RouteSamplePoint[] =>
  rows.map((row) => ({ lat: row.pt_lat, lon: row.pt_lon }));

/** Downsampled lat/lon polyline for lightweight map overlays (not the JPEG preview). */
export async function sampleActivityRoutePoints(
  activityId: number,
  maxPoints = 80,
): Promise<{ points: RouteSamplePoint[] } | null> {
  const activity = await query<{ point_count: number }>(
    `SELECT point_count FROM activities WHERE id = $1`,
    [activityId],
  );
  if (!activity.rowCount) return null;

  const total = Number(activity.rows[0].point_count);
  if (total < 2) return { points: [] };

  if (total <= maxPoints) {
    const points = await query<{ pt_lat: number; pt_lon: number }>(
      `SELECT ${geoPointSelect("point", "pt")}
       FROM track_points WHERE activity_id = $1 ORDER BY sequence`,
      [activityId],
    );
    return { points: mapLatLonRows(points.rows) };
  }

  const result = await query<{ pt_lat: number; pt_lon: number }>(
    `WITH indices AS (
       SELECT gs AS sample_i,
              LEAST(
                $3::int - 1,
                ROUND(gs * ($3::numeric - 1) / GREATEST($2::int - 1, 1))
              )::int AS target_idx
       FROM generate_series(0, $2::int - 1) AS gs
     ),
     ranked AS (
       SELECT (point).lat AS pt_lat, (point).lon AS pt_lon,
              ROW_NUMBER() OVER (ORDER BY sequence) - 1 AS idx
       FROM track_points
       WHERE activity_id = $1
     )
     SELECT DISTINCT ON (i.sample_i) r.pt_lat, r.pt_lon
     FROM indices i
     JOIN ranked r ON r.idx = i.target_idx
     ORDER BY i.sample_i, r.pt_lat, r.pt_lon`,
    [activityId, maxPoints, total],
  );

  return { points: mapLatLonRows(result.rows) };
}