import { elevationGainM, pathDistanceM } from "../geo/pathMetrics.js";
import type { TaggingPoint } from "./types.js";

export const computeTrackDistanceM = (points: readonly TaggingPoint[]): number =>
  pathDistanceM(points);

export const computeElevationGain = (points: readonly TaggingPoint[]): number | null =>
  elevationGainM(points);

export const computeDurationSec = (points: readonly TaggingPoint[]): number | null => {
  let earliest = Infinity;
  let latest = -Infinity;
  let count = 0;
  for (const point of points) {
    if (point.timestamp == null) continue;
    const timestamp = new Date(point.timestamp).getTime();
    if (!Number.isFinite(timestamp)) continue;
    earliest = Math.min(earliest, timestamp);
    latest = Math.max(latest, timestamp);
    count += 1;
  }

  return count >= 2 ? (latest - earliest) / 1000 : null;
};

export const computeAvgSpeedKmh = (
  distanceM: number | null,
  durationSec: number | null,
  points: readonly TaggingPoint[],
): number | null => {
  let speedTotal = 0;
  let speedCount = 0;
  for (const point of points) {
    if (point.speed_mps == null) continue;
    speedTotal += point.speed_mps * 3.6;
    speedCount += 1;
  }

  if (speedCount) {
    return speedTotal / speedCount;
  }

  if (distanceM != null && durationSec != null && durationSec > 0) {
    return (distanceM / durationSec) * 3.6;
  }

  return null;
};
