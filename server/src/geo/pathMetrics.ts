import { haversineM } from "./haversine.js";

export type LatLon = {
  lat: number;
  lon: number;
};

export type ElevPoint = LatLon & {
  elevation_m?: number | null;
};

/** Total path length in meters via successive haversine segments. */
export const pathDistanceM = (points: readonly LatLon[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineM(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon,
    );
  }
  return total;
};

/** Cumulative distance at each point (index 0 = 0). */
export const cumulativeDistancesM = (points: readonly LatLon[]): number[] => {
  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    dists.push(
      dists[i - 1] +
        haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon),
    );
  }
  return dists;
};

/** Sum of positive elevation deltas; null if fewer than two elevation samples. */
export const elevationGainM = (points: readonly ElevPoint[]): number | null => {
  const elevations = points
    .map((p) => p.elevation_m)
    .filter((e): e is number => e != null);
  if (elevations.length < 2) return null;

  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1];
    if (delta > 0) gain += delta;
  }
  return gain;
};
