import { haversineM } from "../geo/haversine.js";
import type { ParsedPoint } from "../types.js";

export type TrackPointMetricsInput = {
  lat: number;
  lon: number;
  timestamp: Date | null;
  speedMps?: number | null;
  distanceM?: number | null;
};

const resolveDistances = (points: readonly TrackPointMetricsInput[]): number[] => {
  const resolved: number[] = [];
  let cumulativeM = 0;

  for (let i = 0; i < points.length; i++) {
    if (i > 0) {
      cumulativeM += haversineM(
        points[i - 1].lat,
        points[i - 1].lon,
        points[i].lat,
        points[i].lon,
      );
    }
    resolved.push(points[i].distanceM ?? cumulativeM);
  }

  return resolved;
};

const resolveSpeedMps = (
  points: readonly TrackPointMetricsInput[],
  resolvedDistances: readonly number[],
  index: number,
): number | null => {
  const point = points[index];
  if (point.speedMps != null) return point.speedMps;
  if (index === 0) return null;

  const prev = points[index - 1];
  const t0 = prev.timestamp;
  const t1 = point.timestamp;
  if (!t0 || !t1) return null;

  const deltaSec = (t1.getTime() - t0.getTime()) / 1000;
  if (deltaSec <= 0) return null;

  const deltaDist = resolvedDistances[index] - resolvedDistances[index - 1];
  if (deltaDist < 0) return null;

  return deltaDist / deltaSec;
};

export const enrichTrackPointMetrics = <T extends TrackPointMetricsInput>(points: readonly T[]): T[] => {
  if (!points.length) return [];

  const resolvedDistances = resolveDistances(points);

  return points.map((point, index) => ({
    ...point,
    distanceM: resolvedDistances[index],
    speedMps: resolveSpeedMps(points, resolvedDistances, index),
  }));
};

export const enrichParsedPoints = (points: readonly ParsedPoint[]): ParsedPoint[] =>
  enrichTrackPointMetrics(points);