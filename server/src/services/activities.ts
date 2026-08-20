/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { geoPointSql, pushGeoPoint } from "../db/geoPoint.js";
import { insertInBatches } from "../db/batchInsert.js";
import { pool, query, withTransaction } from "../db/pool.js";
import { scheduleActivityImported } from "../jobs/activityJobs.js";
import { BadRequestError, NotFoundError } from "../middleware/errors.js";
import { detectFormat, parseActivityFile } from "../parsers/index.js";
import type { ParsedActivity } from "../types.js";
import { enrichActivityMetadata } from "./metadataEnrichment.js";
import { parsedActivityToMetadata } from "./metadataPoints.js";
import { getProfile } from "./profiles.js";
import { deletePreviewFile } from "./routePreview/routePreviewService.js";
import {
  deleteMatchesForActivity,
  loadActivityPoints,
} from "./segmentRepository.js";
import {
  applyActivityMatchWrites,
  computeActivityMatchWrites,
} from "./segmentMatching.js";
import {
  listPairsForActivity,
  listSegmentIdsForActivity,
  uniqueBaselinePairs,
} from "./segmentBaselinePairs.js";
import { rebuildSegmentBaselines } from "./segmentBaselineAggregator.js";
import { lockActivityMatchMutation, lockSegmentIds } from "./segmentMatchLocks.js";

const activitySummaryFrom = `
  FROM activities a
  JOIN profiles p ON p.id = a.profile_id`;

const mapActivitySummary = (row: Record<string, unknown>) => ({
  ...row,
  point_count: Number(row.point_count),
});

/** 9 bind params per track point row (activity_id, sequence, timestamp, geo×3, hr, speed, distance). */
const TRACK_POINT_PARAMS = 9;

const insertTrackPoints = async (
  client: { query: typeof pool.query },
  activityId: number,
  points: ParsedActivity["points"],
) => {
  if (!points.length) return;

  await insertInBatches(points.length, TRACK_POINT_PARAMS, async (start, end) => {
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let param = 1;

    for (let i = start; i < end; i++) {
      const point = points[i];
      values.push(activityId, i, point.timestamp);
      pushGeoPoint(values, {
        lat: point.lat,
        lon: point.lon,
        elevation_m: point.elevationM,
      });
      values.push(point.heartRate, point.speedMps, point.distanceM);
      placeholders.push(
        `($${param},$${param + 1},$${param + 2},${geoPointSql(param + 3)},$${param + 6},$${param + 7},$${param + 8})`,
      );
      param += TRACK_POINT_PARAMS;
    }

    await client.query(
      `INSERT INTO track_points
        (activity_id, sequence, timestamp, point, heart_rate, speed_mps, distance_m)
       VALUES ${placeholders.join(", ")}`,
      values,
    );
  });
};

export async function saveActivity(
  parsed: ParsedActivity,
  sourceFilename: string,
  location: string | null = null,
  tags: string[] = [],
  profileId?: number,
) {
  const format = detectFormat(sourceFilename) ?? "unknown";
  const resolvedProfileId = await resolveProfileId(profileId);
  const pointCount = parsed.points.length;
  const client = await pool.connect();

  let activityId: number;
  try {
    await client.query("BEGIN");

    const activityResult = await client.query<{ id: number }>(
      `INSERT INTO activities
        (name, sport, started_at, duration_sec, distance_m, avg_hr, max_hr, source_format, source_filename, location, tags, profile_id, point_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        parsed.name,
        parsed.sport,
        parsed.startedAt,
        parsed.durationSec,
        parsed.distanceM,
        parsed.avgHr,
        parsed.maxHr,
        format,
        sourceFilename,
        location,
        tags,
        resolvedProfileId,
        pointCount,
      ],
    );

    activityId = activityResult.rows[0].id;
    await insertTrackPoints(client, activityId, parsed.points);
    await client.query("COMMIT");
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    throw err;
  } finally {
    client.release();
  }

  // Match + preview are best-effort after commit so a large rematch cannot
  // roll back the import and so upload latency is not blocked on side work.
  await scheduleActivityImported(activityId);

  return activityId;
}

const resolveProfileId = async (profileId?: number): Promise<number> => {
  if (profileId != null) {
    const profile = await getProfile(profileId);
    if (!profile) throw new NotFoundError("Profile not found");
    return profile.id;
  }
  const defaultProfile = await query<{ id: number }>(
    `SELECT id FROM profiles ORDER BY id LIMIT 1`,
  );
  if (!defaultProfile.rowCount) throw new BadRequestError("No profiles configured");
  return defaultProfile.rows[0].id;
};

export async function importFileContent(
  content: string | Buffer | ArrayBuffer | Uint8Array,
  filename: string,
  profileId?: number,
) {
  const parsed = await parseActivityFile(content, filename);
  // Geocode runs after save via the activity job queue so upload is not blocked
  // on Photon. Tags and a provisional display name are still computed here.
  const metadata = await enrichActivityMetadata(
    {
      name: parsed.name,
      sport: parsed.sport,
      started_at: parsed.startedAt,
      duration_sec: parsed.durationSec,
      distance_m: parsed.distanceM,
      location: null,
    },
    parsedActivityToMetadata(parsed),
    { geocode: false },
  );
  const id = await saveActivity(
    { ...parsed, name: metadata.name },
    filename,
    metadata.location,
    metadata.tags,
    profileId,
  );
  // Match + preview are scheduled inside saveActivity via the job system.
  return { id, parsed: { ...parsed, name: metadata.name }, ...metadata };
}

export async function listActivities(profileId?: number | "all") {
  const params: number[] = [];
  const profileFilter =
    profileId != null && profileId !== "all" ? "WHERE a.profile_id = $1" : "";
  if (profileId != null && profileId !== "all") params.push(profileId);

  const result = await query(
    `SELECT a.*, p.name AS profile_name
     ${activitySummaryFrom}
     ${profileFilter}
     ORDER BY COALESCE(a.started_at, a.created_at) DESC, a.id DESC`,
    params,
  );
  return result.rows.map((row) => mapActivitySummary(row));
}

export async function getActivitySummary(id: number) {
  const activity = await query(
    `SELECT a.*, p.name AS profile_name
     ${activitySummaryFrom}
     WHERE a.id = $1`,
    [id],
  );
  if (activity.rowCount === 0) return null;
  return mapActivitySummary(activity.rows[0]);
}

export async function getActivityPoints(id: number) {
  const exists = await query(`SELECT 1 FROM activities WHERE id = $1`, [id]);
  if (!exists.rowCount) return null;
  return { points: await loadActivityPoints(id) };
}

export async function deleteActivity(id: number): Promise<boolean> {
  const result = await withTransaction(async () => {
    await lockActivityMatchMutation(id);
    const matchedSegmentIds = await listSegmentIdsForActivity(id);
    const sourceSegments = await query<{ id: number }>(
      `SELECT id FROM segments WHERE source_activity_id = $1 ORDER BY id`,
      [id],
    );
    await lockSegmentIds([
      ...matchedSegmentIds,
      ...sourceSegments.rows.map((row) => row.id),
    ]);
    const captured = await listPairsForActivity(id);
    const deleted = await query<{ id: number }>(
      `DELETE FROM activities WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!deleted.rowCount) return false;

    const cascaded = new Set(sourceSegments.rows.map((row) => row.id));
    if (captured?.profileId != null) {
      const pairs = uniqueBaselinePairs(
        captured.segmentIds
          .filter((segmentId) => !cascaded.has(segmentId))
          .map((segmentId) => ({ profileId: captured.profileId!, segmentId })),
      );
      for (const pair of pairs) {
        await rebuildSegmentBaselines({
          profileId: pair.profileId,
          segmentId: pair.segmentId,
          fromDate: captured.activityDate,
        });
      }
    }
    return true;
  });
  if (!result) return false;
  await deletePreviewFile("activities", id);
  return true;
}

export async function updateActivity(
  id: number,
  updates: { name?: string; profile_id?: number },
) {
  const existing = await getActivitySummary(id);
  if (!existing) return null;

  if (updates.profile_id === undefined) {
    await withTransaction(async () => {
      if (updates.name !== undefined) {
        const name = updates.name.trim();
        if (!name) throw new BadRequestError("Name is required");
        await query(`UPDATE activities SET name = $1 WHERE id = $2`, [name, id]);
      }
    });
    return getActivitySummary(id);
  }

  const profile = await getProfile(updates.profile_id);
  if (!profile) throw new NotFoundError("Profile not found");
  const prepared = await computeActivityMatchWrites(id);

  await withTransaction(async () => {
    await lockActivityMatchMutation(id);
    const oldSegmentIds = await listSegmentIdsForActivity(id);
    await lockSegmentIds([
      ...oldSegmentIds,
      ...prepared.writes.map((write) => write.segmentId),
    ]);
    const captured = await listPairsForActivity(id);
    if (!captured) throw new NotFoundError("Activity not found");

    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (!name) throw new BadRequestError("Name is required");
      await query(`UPDATE activities SET name = $1 WHERE id = $2`, [name, id]);
    }

    await query(`UPDATE activities SET profile_id = $1 WHERE id = $2`, [profile.id, id]);
    await deleteMatchesForActivity(id);
    await applyActivityMatchWrites(id, prepared);

    const pairs = uniqueBaselinePairs([
      ...(captured.profileId == null
        ? []
        : captured.segmentIds.map((segmentId) => ({
            profileId: captured.profileId!,
            segmentId,
          }))),
      ...prepared.writes.map((write) => ({ profileId: profile.id, segmentId: write.segmentId })),
    ]);
    for (const pair of pairs) {
      await rebuildSegmentBaselines({
        profileId: pair.profileId,
        segmentId: pair.segmentId,
        fromDate: captured.activityDate,
      });
    }
  });

  return getActivitySummary(id);
}

export const getActivityDeleteInfo = async (activityId: number) => {
  const segments = await query<{ id: number; name: string }>(
    `SELECT id, name FROM segments WHERE source_activity_id = $1 ORDER BY name`,
    [activityId],
  );
  return {
    segment_count: segments.rowCount ?? 0,
    segments: segments.rows,
  };
};

export const getActivityMatchedSegments = async (activityId: number) => {
  const exists = await query(`SELECT 1 FROM activities WHERE id = $1`, [activityId]);
  if (!exists.rowCount) return null;

  const result = await query<{
    id: number;
    name: string;
    location: string | null;
    tags: string[];
    pass_count: string;
  }>(
    `SELECT s.id, s.name, s.location, s.tags,
            COUNT(m.id)::text AS pass_count
     FROM activity_segment_matches m
     JOIN segments s ON s.id = m.segment_id
     WHERE m.activity_id = $1
     GROUP BY s.id, s.name, s.location, s.tags
     ORDER BY s.name`,
    [activityId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    location: row.location,
    tags: row.tags,
    pass_count: Number(row.pass_count),
  }));
};
