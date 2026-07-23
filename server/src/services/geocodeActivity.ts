/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP). Unit coverage ignored; pure plan is tested separately.

import { query } from "../db/pool.js";
import { resolveActivityLocation } from "./activityLocation.js";
import { planActivityGeocodeUpdate } from "./planActivityGeocodeUpdate.js";

type ActivityGeocodeRow = {
  name: string;
  location: string | null;
  tags: string[] | null;
};

type StartPointRow = {
  lat: number;
  lon: number;
};

/**
 * Reverse-geocode an activity start point and patch name/location when missing.
 * No-op when the activity is missing, already has a location, or has no points.
 */
export const geocodeActivity = async (activityId: number): Promise<void> => {
  const activityResult = await query<ActivityGeocodeRow>(
    `SELECT name, location, tags FROM activities WHERE id = $1`,
    [activityId],
  );
  const activity = activityResult.rows[0];
  if (!activity) return;
  if (activity.location) return;

  const startResult = await query<StartPointRow>(
    `SELECT (point).lat AS lat, (point).lon AS lon
     FROM track_points
     WHERE activity_id = $1
     ORDER BY sequence
     LIMIT 1`,
    [activityId],
  );
  const start = startResult.rows[0];
  if (!start) return;

  const geocodedLocation = await resolveActivityLocation(start.lat, start.lon);
  const plan = planActivityGeocodeUpdate({
    currentName: activity.name,
    currentLocation: activity.location,
    tags: activity.tags ?? [],
    geocodedLocation,
  });

  if (plan.action === "skip") return;

  await query(`UPDATE activities SET name = $1, location = $2 WHERE id = $3`, [
    plan.name,
    plan.location,
    activityId,
  ]);
};
