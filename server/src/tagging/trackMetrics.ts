import { elevationGainM, pathDistanceM } from "../geo/pathMetrics.js";
import type { TaggingPoint } from "./types.js";

export const computeTrackDistanceM = (points: readonly TaggingPoint[]): number =>
  pathDistanceM(points);

export const computeElevationGain = (points: readonly TaggingPoint[]): number | null =>
  elevationGainM(points);

export const computeDurationSec = (points: readonly TaggingPoint[]): number | null => {
  const timestamps = points
    .map((point) => point.timestamp)
    .filter((value): value is Date | string => value != null)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));

  if (timestamps.length < 2) return null;
  return (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
};

export const computeAvgSpeedKmh = (
  distanceM: number | null,
  durationSec: number | null,
  points: readonly TaggingPoint[],
): number | null => {
  const pointSpeeds = points
    .map((point) => point.speed_mps)
    .filter((value): value is number => value != null)
    .map((speedMps) => speedMps * 3.6);

  if (pointSpeeds.length) {
    return pointSpeeds.reduce((sum, speed) => sum + speed, 0) / pointSpeeds.length;
  }

  if (distanceM != null && durationSec != null && durationSec > 0) {
    return (distanceM / durationSec) * 3.6;
  }

  return null;
};
