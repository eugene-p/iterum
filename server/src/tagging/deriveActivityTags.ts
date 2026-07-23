import { deriveActivityTypeTag } from "./deriveActivityTypeTag.js";
import { deriveTerrainTag } from "./deriveTerrainTag.js";
import { deriveTimeOfDayTag } from "./deriveTimeOfDayTag.js";
import { normalizeTags } from "./normalizeTags.js";
import { computeAvgSpeedKmh } from "./trackMetrics.js";

export type DeriveActivityTagsInput = {
  sport: string | null;
  startedAt: Date | null;
  distanceM: number | null;
  durationSec: number | null;
  elevationGainM: number | null;
  startLon: number | null;
};

export const deriveActivityTags = (input: DeriveActivityTagsInput): string[] => {
  const avgSpeedKmh = computeAvgSpeedKmh(input.distanceM, input.durationSec, []);

  const tags = [
    deriveTimeOfDayTag(input.startedAt, input.startLon),
    deriveActivityTypeTag(input.sport, avgSpeedKmh),
    deriveTerrainTag(input.elevationGainM, input.distanceM),
  ].filter((tag): tag is string => tag != null);

  return normalizeTags(tags);
};