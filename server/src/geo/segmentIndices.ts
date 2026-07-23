import { BadRequestError } from "../middleware/errors.js";

export type GeoPoint = { lat: number; lon: number };

type IndexedPoint = GeoPoint;

export type SegmentEndpoints = {
  start: GeoPoint;
  end: GeoPoint;
};

export const nearestPointIndex = (points: IndexedPoint[], lat: number, lon: number): number => {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = (points[i].lat - lat) ** 2 + (points[i].lon - lon) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
};

export const nearestPointIndexAfter = (
  points: IndexedPoint[],
  afterIndex: number,
  lat: number,
  lon: number,
): number | null => {
  if (afterIndex >= points.length - 1) return null;
  let best = -1;
  let bestDist = Infinity;
  for (let i = afterIndex + 1; i < points.length; i++) {
    const dist = (points[i].lat - lat) ** 2 + (points[i].lon - lon) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best >= 0 ? best : null;
};

export const resolveSegmentIndices = (
  points: IndexedPoint[],
  endpoints: SegmentEndpoints,
): { start_index: number; end_index: number } => {
  const start_index = nearestPointIndex(points, endpoints.start.lat, endpoints.start.lon);
  const end_index = nearestPointIndexAfter(
    points,
    start_index,
    endpoints.end.lat,
    endpoints.end.lon,
  );
  if (end_index == null || end_index <= start_index) {
    throw new BadRequestError(
      "Segment end must be further along the route than the start. Click an end point ahead on the path.",
    );
  }
  return { start_index, end_index };
};

