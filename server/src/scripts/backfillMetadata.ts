/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import "dotenv/config";
import { pool, query } from "../db/pool.js";
import {
  enrichActivityMetadata,
  enrichSegmentMetadata,
} from "../services/metadataEnrichment.js";
import { trackPointsToMetadata } from "../services/metadataPoints.js";
import {
  getSegmentReferencePoints,
  loadActivityPoints,
} from "../services/segmentRepository.js";

const GEOCODE_DELAY_MS = 300;

type ActivityRow = {
  id: number;
  name: string;
  sport: string | null;
  started_at: string | null;
  duration_sec: number | null;
  distance_m: number | null;
  location: string | null;
  tags: string[] | null;
  source_filename: string;
};

type SegmentRow = {
  id: number;
  name: string;
  source_activity_id: number;
  location: string | null;
  tags: string[] | null;
};

const formatTags = (tags: string[]): string => (tags.length ? tags.join(", ") : "—");

const backfillActivities = async (dryRun: boolean, geocode: boolean): Promise<number> => {
  const activities = await query<ActivityRow>(`SELECT * FROM activities ORDER BY id`);
  let updated = 0;

  for (const activity of activities.rows) {
    const points = trackPointsToMetadata(await loadActivityPoints(activity.id));
    if (!points.length) {
      console.log(`skip activity #${activity.id}: no track points`);
      continue;
    }

    const enriched = await enrichActivityMetadata(activity, points, {
      geocode,
      geocodeDelayMs: geocode ? GEOCODE_DELAY_MS : undefined,
    });

    const nameChanged = enriched.name !== activity.name;
    const locationChanged = enriched.location !== activity.location;
    const tagsChanged =
      JSON.stringify(enriched.tags) !== JSON.stringify(activity.tags ?? []);

    if (!nameChanged && !locationChanged && !tagsChanged) continue;

    console.log(
      [
        `${dryRun ? "[dry-run] " : ""}activity #${activity.id}`,
        nameChanged ? `name: ${activity.name} → ${enriched.name}` : null,
        locationChanged ? `location: ${activity.location ?? "—"} → ${enriched.location ?? "—"}` : null,
        tagsChanged ? `tags: ${formatTags(enriched.tags)}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
    );

    if (!dryRun) {
      await query(`UPDATE activities SET name = $1, location = $2, tags = $3 WHERE id = $4`, [
        enriched.name,
        enriched.location,
        enriched.tags,
        activity.id,
      ]);
    }

    updated += 1;
  }

  return updated;
};

const backfillSegments = async (dryRun: boolean, geocode: boolean): Promise<number> => {
  const segments = await query<SegmentRow>(`SELECT id, name, source_activity_id, location, tags FROM segments ORDER BY id`);
  let updated = 0;

  for (const segment of segments.rows) {
    const referencePoints = (await getSegmentReferencePoints(segment.id)).map((point) => ({
      ...point,
      speed_mps: null,
      timestamp: null,
    }));
    if (referencePoints.length < 2) {
      console.log(`skip segment #${segment.id}: no reference path`);
      continue;
    }

    const activity = await query<{
      location: string | null;
      sport: string | null;
    }>(`SELECT location, sport FROM activities WHERE id = $1`, [segment.source_activity_id]);

    if (!activity.rowCount) {
      console.log(`skip segment #${segment.id}: source activity missing`);
      continue;
    }

    const enriched = await enrichSegmentMetadata(
      segment,
      referencePoints,
      {
        location: activity.rows[0].location,
        sport: activity.rows[0].sport,
      },
      { geocode, geocodeDelayMs: geocode ? GEOCODE_DELAY_MS : undefined },
    );

    const locationChanged = enriched.location !== segment.location;
    const tagsChanged =
      JSON.stringify(enriched.tags) !== JSON.stringify(segment.tags ?? []);

    if (!locationChanged && !tagsChanged) continue;

    console.log(
      [
        `${dryRun ? "[dry-run] " : ""}segment #${segment.id} (${segment.name})`,
        locationChanged ? `location: ${segment.location ?? "—"} → ${enriched.location ?? "—"}` : null,
        tagsChanged ? `tags: ${formatTags(enriched.tags)}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
    );

    if (!dryRun) {
      await query(`UPDATE segments SET location = $1, tags = $2 WHERE id = $3`, [
        enriched.location,
        enriched.tags,
        segment.id,
      ]);
    }

    updated += 1;
  }

  return updated;
};

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes("--dry-run");
  const skipGeocode = process.argv.includes("--skip-geocode");
  const activitiesOnly = process.argv.includes("--activities-only");
  const segmentsOnly = process.argv.includes("--segments-only");
  const geocode = !skipGeocode;

  if (activitiesOnly && segmentsOnly) {
    throw new Error("Use only one of --activities-only or --segments-only");
  }

  console.log(
    [
      "Backfill metadata",
      dryRun ? "(dry run)" : "(writing changes)",
      geocode ? "with geocoding" : "without geocoding",
    ].join(" "),
  );

  let activityUpdates = 0;
  let segmentUpdates = 0;

  if (!segmentsOnly) {
    activityUpdates = await backfillActivities(dryRun, geocode);
  }
  if (!activitiesOnly) {
    segmentUpdates = await backfillSegments(dryRun, geocode);
  }

  console.log(
    `Done. Updated ${activityUpdates} activit${activityUpdates === 1 ? "y" : "ies"} and ${segmentUpdates} segment${segmentUpdates === 1 ? "" : "s"}.`,
  );
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });