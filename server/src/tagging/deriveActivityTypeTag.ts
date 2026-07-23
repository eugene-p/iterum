import { WALK_SPEED_KMH } from "./tagConstants.js";

export const sportToActivityTypeTag = (sport: string | null): string | null => {
  if (!sport) return null;

  const normalized = sport.trim().toLowerCase();
  if (normalized.includes("walk")) return "walk";
  if (normalized.includes("run")) return "run";
  if (normalized.includes("bik") || normalized.includes("cycl")) return "bike";
  if (normalized.includes("hik")) return "hike";
  return null;
};

export const deriveActivityTypeTag = (
  sport: string | null,
  avgSpeedKmh: number | null,
): string | null => {
  const sportTag = sportToActivityTypeTag(sport);
  if (sportTag) return sportTag;

  if (avgSpeedKmh == null) return null;
  return avgSpeedKmh < WALK_SPEED_KMH ? "walk" : "run";
};