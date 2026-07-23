import { HILLS_GRADE_PCT, MOUNTAINS_GRADE_PCT } from "./tagConstants.js";

export const deriveTerrainTag = (
  elevationGainM: number | null,
  distanceM: number | null,
): string | null => {
  if (elevationGainM == null || distanceM == null || distanceM <= 0) return null;

  const gradePct = (elevationGainM / distanceM) * 100;
  if (gradePct >= MOUNTAINS_GRADE_PCT) return "mountains";
  if (gradePct >= HILLS_GRADE_PCT) return "hills";
  return null;
};