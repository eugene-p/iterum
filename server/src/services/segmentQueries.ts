/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { query } from "../db/pool.js";
import {
  getSegmentReferencePoints,
  listAllSegments,
  loadSegment,
} from "./segmentRepository.js";
import {
  DEFAULT_STRETCH_THRESHOLDS,
} from "./stretchSegmentation.js";
import {
  computeStretchesForSegment,
  isStretchPreviewActive,
  type StretchPreviewOptions,
} from "./stretchCompare.js";
import { loadSegmentStretches } from "./stretchRepository.js";

export { getSegmentReferencePoints } from "./segmentRepository.js";

const buildStretchPayload = async (
  segmentId: number,
  segmentSourceActivityId: number,
  preview: StretchPreviewOptions,
) => {
  const saved = await loadSegmentStretches(segmentId);
  const previewActive = isStretchPreviewActive(saved, preview, segmentSourceActivityId);

  if (!previewActive && saved) {
    return {
      stretches: saved.stretches,
      stretch_thresholds: saved.stretch_thresholds ?? DEFAULT_STRETCH_THRESHOLDS,
      stretch_reason: saved.stretch_reason,
      stretch_source_activity_id: saved.stretch_source_activity_id,
      stretch_state: "saved" as const,
      stretch_can_save: false,
    };
  }

  const thresholds = preview.thresholds ?? saved?.stretch_thresholds ?? DEFAULT_STRETCH_THRESHOLDS;
  const stretchSourceActivityId =
    preview.stretchSourceActivityId ??
    saved?.stretch_source_activity_id ??
    segmentSourceActivityId;
  const useActivityPass = stretchSourceActivityId !== segmentSourceActivityId;
  const stretchResult = await computeStretchesForSegment(
    segmentId,
    stretchSourceActivityId,
    thresholds,
    useActivityPass,
  );

  return {
    stretches: stretchResult.stretches,
    stretch_thresholds: stretchResult.thresholds,
    stretch_reason: stretchResult.reason ?? null,
    stretch_source_activity_id: stretchSourceActivityId,
    stretch_state: saved ? ("preview" as const) : ("unsaved" as const),
    stretch_can_save: true,
  };
};

export const listSegments = async (profileId?: number | "all" | null) =>
  listAllSegments(profileId);

export const getSegmentById = async (segmentId: number) => loadSegment(segmentId);

export const getSegmentPasses = async (
  segmentId: number,
  preview: StretchPreviewOptions = {},
) => {
  const segment = await loadSegment(segmentId);
  if (!segment) return null;

  const matches = await query(
    `SELECT m.*, a.name AS activity_name, a.started_at, a.created_at, a.source_filename,
            p.name AS profile_name
     FROM activity_segment_matches m
     JOIN activities a ON a.id = m.activity_id
     JOIN profiles p ON p.id = a.profile_id
     WHERE m.segment_id = $1
     ORDER BY COALESCE(a.started_at, a.created_at) DESC, m.activity_id DESC, m.pass_number ASC`,
    [segmentId],
  );

  const reference = await getSegmentReferencePoints(segmentId);

  const stretchPayload = await buildStretchPayload(
    segmentId,
    segment.source_activity_id,
    preview,
  );

  return {
    segment,
    reference_points: reference,
    ...stretchPayload,
    passes: matches.rows.map((row) => ({
      id: row.id,
      activity_id: row.activity_id,
      activity_name: row.activity_name,
      profile_name: row.profile_name,
      source_filename: row.source_filename,
      started_at: row.started_at,
      created_at: row.created_at,
      pass_number: row.pass_number,
      match_score: row.match_score,
      matched: true,
      duration_sec: row.duration_sec,
      distance_m: row.distance_m,
      avg_speed_kmh: row.avg_speed_kmh,
      max_speed_kmh: row.max_speed_kmh,
      avg_hr: row.avg_hr,
      max_hr: row.max_hr,
      elevation_gain_m: row.elevation_gain_m,
      start_index: row.start_index,
      end_index: row.end_index,
    })),
  };
};
