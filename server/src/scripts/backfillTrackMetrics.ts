/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import "dotenv/config";
import { geoPointSelect } from "../db/geoPoint.js";
import { pool, query } from "../db/pool.js";
import { enrichTrackPointMetrics } from "../services/trackPointMetrics.js";

type ActivityRow = {
  id: number;
  distance_m: number | null;
};

type TrackPointRow = {
  id: number;
  pt_lat: number;
  pt_lon: number;
  timestamp: string | null;
  speed_mps: number | null;
  distance_m: number | null;
};

const loadActivityPoints = async (activityId: number): Promise<TrackPointRow[]> => {
  const result = await query<TrackPointRow>(
    `SELECT tp.id, ${geoPointSelect("point", "pt")}, tp.timestamp, tp.speed_mps, tp.distance_m
     FROM track_points tp
     WHERE tp.activity_id = $1
     ORDER BY tp.sequence`,
    [activityId],
  );
  return result.rows;
};

const updateTrackPoints = async (
  pointIds: number[],
  distances: Array<number | null>,
  speeds: Array<number | null>,
): Promise<void> => {
  await query(
    `UPDATE track_points AS tp
     SET distance_m = v.distance_m,
         speed_mps = v.speed_mps
     FROM (
       SELECT unnest($1::int[]) AS id,
              unnest($2::float8[]) AS distance_m,
              unnest($3::float8[]) AS speed_mps
     ) AS v
     WHERE tp.id = v.id`,
    [pointIds, distances, speeds],
  );
};

const backfillActivity = async (activity: ActivityRow, dryRun: boolean): Promise<boolean> => {
  const rows = await loadActivityPoints(activity.id);
  if (!rows.length) {
    console.log(`skip activity #${activity.id}: no track points`);
    return false;
  }

  const needsUpdate = rows.some((row) => row.distance_m == null || row.speed_mps == null);
  if (!needsUpdate) {
    console.log(`skip activity #${activity.id}: track metrics already present`);
    return false;
  }

  const enriched = enrichTrackPointMetrics(
    rows.map((row) => ({
      lat: row.pt_lat,
      lon: row.pt_lon,
      timestamp: row.timestamp ? new Date(row.timestamp) : null,
      speedMps: row.speed_mps,
      distanceM: row.distance_m,
    })),
  );

  const pointIds = rows.map((row) => row.id);
  const distances = enriched.map((point) => point.distanceM);
  const speeds = enriched.map((point) => point.speedMps);
  const totalDistanceM = distances.at(-1) ?? null;

  console.log(
    [
      `${dryRun ? "[dry-run] " : ""}activity #${activity.id}`,
      `${rows.length} points`,
      totalDistanceM != null ? `distance ${totalDistanceM.toFixed(1)} m` : null,
      `${speeds.filter((speed) => speed != null).length} speeds computed`,
    ]
      .filter(Boolean)
      .join(" | "),
  );

  if (!dryRun) {
    await updateTrackPoints(pointIds, distances, speeds);
    if (activity.distance_m == null && totalDistanceM != null) {
      await query(`UPDATE activities SET distance_m = $1 WHERE id = $2`, [totalDistanceM, activity.id]);
    }
  }

  return true;
};

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes("--dry-run");
  const activityIdArg = process.argv.find((arg) => arg.startsWith("--activity="));
  const activityIdFilter = activityIdArg ? Number(activityIdArg.split("=")[1]) : null;

  console.log(`Backfill track metrics${dryRun ? " (dry run)" : ""}`);

  const activities = await query<ActivityRow>(
    activityIdFilter != null && Number.isFinite(activityIdFilter)
      ? `SELECT id, distance_m FROM activities WHERE id = $1 ORDER BY id`
      : `SELECT DISTINCT a.id, a.distance_m
         FROM activities a
         JOIN track_points tp ON tp.activity_id = a.id
         WHERE tp.distance_m IS NULL OR tp.speed_mps IS NULL
         ORDER BY a.id`,
    activityIdFilter != null && Number.isFinite(activityIdFilter) ? [activityIdFilter] : [],
  );

  let updated = 0;
  for (const activity of activities.rows) {
    if (await backfillActivity(activity, dryRun)) {
      updated += 1;
    }
  }

  console.log(`Done. ${dryRun ? "Would update" : "Updated"} ${updated} activit${updated === 1 ? "y" : "ies"}.`);
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });