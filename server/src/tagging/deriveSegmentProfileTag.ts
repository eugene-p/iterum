import { segmentizeStretches, type StretchPoint } from "../services/stretchSegmentation.js";
import type { TaggingPoint } from "./types.js";

const toStretchPoints = (points: readonly TaggingPoint[]): StretchPoint[] =>
  points.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    elevation_m: point.elevation_m,
  }));

export const deriveSegmentProfileTag = (points: readonly TaggingPoint[]): string | null => {
  if (points.length < 2) return null;

  const result = segmentizeStretches(toStretchPoints(points));
  if (!result.stretches.length) return null;

  const dominant = result.stretches.reduce((best, stretch) =>
    stretch.length_m > best.length_m ? stretch : best,
  );

  return dominant.kind;
};