import { deriveActivityTypeTag } from "./deriveActivityTypeTag.js";
import { deriveSegmentProfileTag } from "./deriveSegmentProfileTag.js";
import { deriveTerrainTag } from "./deriveTerrainTag.js";
import { normalizeTags } from "./normalizeTags.js";
import {
  computeAvgSpeedKmh,
  computeDurationSec,
  computeElevationGain,
  computeTrackDistanceM,
} from "./trackMetrics.js";
import type { TaggingPoint } from "./types.js";

export type DeriveSegmentTagsInput = {
  points: readonly TaggingPoint[];
  activitySport?: string | null;
};

export const deriveSegmentTags = (input: DeriveSegmentTagsInput): string[] => {
  const distanceM = computeTrackDistanceM(input.points);
  const durationSec = computeDurationSec(input.points);
  const elevationGainM = computeElevationGain(input.points);
  const avgSpeedKmh = computeAvgSpeedKmh(distanceM, durationSec, input.points);

  const tags = [
    deriveActivityTypeTag(input.activitySport ?? null, avgSpeedKmh),
    deriveTerrainTag(elevationGainM, distanceM),
    deriveSegmentProfileTag(input.points),
  ].filter((tag): tag is string => tag != null);

  return normalizeTags(tags);
};