import { haversineM } from "./haversine";

export type SegmentBoundary = {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m?: number;
};

export const findSegmentSliceIndices = <T extends { lat: number; lon: number }>(
  points: T[],
  segment: SegmentBoundary,
): { startIdx: number; endIdx: number } | null => {
  if (points.length < 2) return null;

  const radius = segment.radius_m ?? 30;
  let startIdx: number | null = null;
  let endIdx: number | null = null;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const distStart = haversineM(point.lat, point.lon, segment.start_lat, segment.start_lon);
    const distEnd = haversineM(point.lat, point.lon, segment.end_lat, segment.end_lon);

    if (startIdx == null) {
      if (distStart <= radius) startIdx = i;
    } else if (distEnd <= radius) {
      endIdx = i;
      break;
    }
  }

  if (startIdx == null || endIdx == null || endIdx <= startIdx) return null;
  return { startIdx, endIdx };
};