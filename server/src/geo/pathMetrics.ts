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
  let previous: number | null = null;
  let count = 0;
  let gain = 0;
  for (const point of points) {
    const elevation = point.elevation_m;
    if (elevation == null) continue;
    if (previous == null) {
      previous = elevation;
      count += 1;
      continue;
    }
    const delta = elevation - previous;
    if (delta > 0) gain += delta;
    previous = elevation;
    count += 1;
  }
  return count >= 2 ? gain : null;
};
