/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { withTransaction } from "../db/pool.js";
import { nearestPointIndex, nearestPointIndexAfter, resolveSegmentIndices } from "../geo/segmentIndices.js";
import { BadRequestError, NotFoundError } from "../middleware/errors.js";
import { enrichSegmentMetadata } from "./metadataEnrichment.js";
import { trackPointsToMetadata } from "./metadataPoints.js";
import {
  deletePreviewFile,
  warmSegmentPreviewImage,
} from "./routePreview/routePreviewService.js";
import type { TrackPointRow } from "./segmentMatcher.js";
import {
  matchSegmentAcrossActivities,
  rematchSegment,
  toSegmentDefinition,
} from "./segmentMatching.js";
import {
  deleteReferencePoints,
  deleteSegmentRow,
  loadActivityPoints,
  loadActivitySegmentContext,
  loadReferencePoints,
  loadSegment,
  persistNewSegment,
  saveReferencePoints,
  updateSegmentRow,
} from "./segmentRepository.js";
import {
  persistDefaultStretches,
  saveStretchesForSegment,
} from "./stretchCompare.js";
import type { StretchThresholds } from "./stretchSegmentation.js";
import { getProfileStretchThresholdsForActivity } from "./profiles.js";

export interface CreateSegmentInput {
  name: string;
  description?: string | null;
  source_activity_id: number;
  start_index: number;
  end_index: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m?: number;
  match_threshold?: number;
}

export interface UpdateSegmentInput {
  name?: string;
  description?: string | null;
  start_lat?: number;
  start_lon?: number;
  end_lat?: number;
  end_lon?: number;
  radius_m?: number;
  match_threshold?: number;
}

const resolveIndices = (
  points: TrackPointRow[],
  input: CreateSegmentInput,
): { start_index: number; end_index: number } => {
  const hasValidIndices =
    input.end_index > input.start_index &&
    input.start_index >= 0 &&
    input.end_index < points.length;

  if (hasValidIndices) {
    return { start_index: input.start_index, end_index: input.end_index };
  }

  return resolveSegmentIndices(points, {
    start: { lat: input.start_lat, lon: input.start_lon },
    end: { lat: input.end_lat, lon: input.end_lon },
  });
};

const persistSegmentWithMatching = async (input: {
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
  referencePoints: TrackPointRow[];
  preferMatcherForSourcePass?: boolean;
}) => {
  // Persist segment + reference path atomically. Matching loads tracks concurrently
  // and must not share a single transaction client.
  const segment = await withTransaction(async () => {
    const created = await persistNewSegment(input);
    await saveReferencePoints(created.id, input.referencePoints);
    return created;
  });

  const definition = toSegmentDefinition(segment);
  const includeSourcePass =
    !input.preferMatcherForSourcePass &&
    input.start_index < input.end_index
      ? { start_index: input.start_index, end_index: input.end_index }
      : undefined;

  await matchSegmentAcrossActivities({
    segmentId: segment.id,
    sourceActivityId: input.source_activity_id,
    definition,
    referencePoints: input.referencePoints,
    sourcePassIndices: includeSourcePass,
  });

  const profileThresholds = await getProfileStretchThresholdsForActivity(
    input.source_activity_id,
  );
  await persistDefaultStretches(segment.id, input.source_activity_id, profileThresholds);
  await warmSegmentPreviewImage(segment.id);
  return segment;
};

export const createSegmentFromActivity = async (input: CreateSegmentInput) => {
  const activityContext = await loadActivitySegmentContext(input.source_activity_id);
  const points = await loadActivityPoints(input.source_activity_id);
  if (points.length < 2) {
    throw new BadRequestError("Source activity has too few GPS points");
  }

  const { start_index, end_index } = resolveIndices(points, input);
  const radius = input.radius_m ?? 30;
  const threshold = input.match_threshold ?? 0.9;
  const referenceSlice = points.slice(start_index, end_index + 1);

  const metadata = await enrichSegmentMetadata(
    { location: activityContext.location },
    trackPointsToMetadata(referenceSlice),
    activityContext,
  );

  return persistSegmentWithMatching({
    name: input.name,
    description: input.description,
    source_activity_id: input.source_activity_id,
    start_index,
    end_index,
    start_lat: points[start_index].lat,
    start_lon: points[start_index].lon,
    end_lat: points[end_index].lat,
    end_lon: points[end_index].lon,
    radius_m: radius,
    match_threshold: threshold,
    location: metadata.location,
    tags: metadata.tags,
    referencePoints: referenceSlice,
  });
};

export const updateSegment = async (segmentId: number, input: UpdateSegmentInput) => {
  const segment = await loadSegment(segmentId);
  if (!segment) throw new NotFoundError("Segment not found");

  const geometryChanged =
    input.start_lat != null ||
    input.start_lon != null ||
    input.end_lat != null ||
    input.end_lon != null;

  const name = input.name?.trim() || segment.name;
  if (!name) throw new BadRequestError("Name is required");
  const description = input.description !== undefined ? input.description : segment.description;
  const radius_m = input.radius_m ?? segment.radius_m;
  const match_threshold = input.match_threshold ?? segment.match_threshold;

  let start_index = segment.start_index;
  let end_index = segment.end_index;
  let start_lat = segment.start_lat;
  let start_lon = segment.start_lon;
  let end_lat = segment.end_lat;
  let end_lon = segment.end_lon;
  let referencePoints: TrackPointRow[] | null = null;

  if (geometryChanged) {
    const points = await loadActivityPoints(segment.source_activity_id);
    if (points.length < 2) {
      throw new BadRequestError("Source activity has too few GPS points");
    }

    const resolved = resolveSegmentIndices(points, {
      start: {
        lat: input.start_lat ?? segment.start_lat,
        lon: input.start_lon ?? segment.start_lon,
      },
      end: {
        lat: input.end_lat ?? segment.end_lat,
        lon: input.end_lon ?? segment.end_lon,
      },
    });
    start_index = resolved.start_index;
    end_index = resolved.end_index;
    start_lat = points[start_index].lat;
    start_lon = points[start_index].lon;
    end_lat = points[end_index].lat;
    end_lon = points[end_index].lon;
    referencePoints = points.slice(start_index, end_index + 1);
  }

  const matchingChanged =
    geometryChanged ||
    radius_m !== segment.radius_m ||
    match_threshold !== segment.match_threshold;

  const updated = await withTransaction(async () => {
    if (geometryChanged && referencePoints) {
      await deleteReferencePoints(segmentId);
      await saveReferencePoints(segmentId, referencePoints);
      const profileThresholds = await getProfileStretchThresholdsForActivity(
        segment.source_activity_id,
      );
      await persistDefaultStretches(segmentId, segment.source_activity_id, profileThresholds);
    }

    return updateSegmentRow(segmentId, {
      name,
      description,
      start_index,
      end_index,
      start_lat,
      start_lon,
      end_lat,
      end_lon,
      radius_m,
      match_threshold,
    });
  });

  if (geometryChanged) {
    await deletePreviewFile("segments", segmentId);
    await warmSegmentPreviewImage(segmentId);
  }

  if (matchingChanged) {
    const refs = referencePoints ?? (await loadReferencePoints(segmentId));
    await rematchSegment(segmentId, toSegmentDefinition(updated), refs);
  }

  return updated;
};

export const createReversedSegment = async (segmentId: number, name: string) => {
  const segment = await loadSegment(segmentId);
  if (!segment) throw new NotFoundError("Segment not found");

  const reference = await loadReferencePoints(segmentId);
  if (reference.length < 2) {
    throw new BadRequestError("Segment has no reference path");
  }

  const reversedReference = [...reference].reverse();
  const reversedName = name.trim() || `${segment.name} (reversed)`;
  const activityContext = await loadActivitySegmentContext(segment.source_activity_id);
  const activityPoints = await loadActivityPoints(segment.source_activity_id);

  const reversedStartIndex = nearestPointIndex(
    activityPoints,
    segment.end_lat,
    segment.end_lon,
  );
  const reversedEndIndex = nearestPointIndexAfter(
    activityPoints,
    reversedStartIndex,
    segment.start_lat,
    segment.start_lon,
  );
  if (reversedEndIndex == null || reversedEndIndex <= reversedStartIndex) {
    throw new BadRequestError(
      "Could not resolve reversed segment endpoints on the source activity. The return leg may be missing.",
    );
  }

  const metadata = await enrichSegmentMetadata(
    { location: segment.location },
    trackPointsToMetadata(reversedReference),
    activityContext,
  );

  return persistSegmentWithMatching({
    name: reversedName,
    source_activity_id: segment.source_activity_id,
    start_index: reversedStartIndex,
    end_index: reversedEndIndex,
    start_lat: segment.end_lat,
    start_lon: segment.end_lon,
    end_lat: segment.start_lat,
    end_lon: segment.start_lon,
    radius_m: segment.radius_m,
    match_threshold: segment.match_threshold,
    location: metadata.location ?? segment.location,
    tags: metadata.tags,
    referencePoints: reversedReference,
    preferMatcherForSourcePass: true,
  });
};

export const saveSegmentStretchesFromPreview = async (
  segmentId: number,
  thresholds: StretchThresholds,
  stretchSourceActivityId?: number | null,
) => {
  const segment = await loadSegment(segmentId);
  if (!segment) throw new NotFoundError("Segment not found");
  return saveStretchesForSegment(
    segmentId,
    segment.source_activity_id,
    thresholds,
    stretchSourceActivityId,
  );
};

export const deleteSegment = async (segmentId: number): Promise<boolean> => {
  const deleted = await deleteSegmentRow(segmentId);
  if (!deleted) return false;
  await deletePreviewFile("segments", segmentId);
  return true;
};
