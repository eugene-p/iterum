export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDistance(meters?: number | null): string {
  if (meters == null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatSpeed(kmh?: number | null): string {
  if (kmh == null) return "—";
  return `${kmh.toFixed(2)} km/h`;
}

export function formatHr(hr?: number | null): string {
  if (hr == null) return "—";
  return `${Math.round(hr)} bpm`;
}

export function formatPaceFromSpeed(kmh?: number | null): string {
  if (kmh == null || kmh <= 0) return "—";
  const minPerKm = 60 / kmh;
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
}

export { haversineM } from "./lib/geo/haversine";

export function nearestTrackPointIndex<T extends { lat: number; lon: number }>(
  points: T[],
  lat: number,
  lon: number,
): number {
  if (!points.length) return -1;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < points.length; i++) {
    const dist = (points[i].lat - lat) ** 2 + (points[i].lon - lon) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function nearestTrackPointIndexAfter<T extends { lat: number; lon: number }>(
  points: T[],
  afterIndex: number,
  lat: number,
  lon: number,
): number {
  if (afterIndex >= points.length - 1) return -1;
  let bestIdx = -1;
  let bestDist = Infinity;
  for (let i = afterIndex + 1; i < points.length; i++) {
    const dist = (points[i].lat - lat) ** 2 + (points[i].lon - lon) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function nearestTrackPoint<T extends { lat: number; lon: number }>(
  points: T[],
  lat: number,
  lon: number,
): T | null {
  const idx = nearestTrackPointIndex(points, lat, lon);
  return idx >= 0 ? points[idx] : null;
}

export function sliceDraftOnTrack<T extends { lat: number; lon: number }>(
  points: T[],
  draft: {
    start_lat: number;
    start_lon: number;
    end_lat: number;
    end_lon: number;
    start_index?: number;
    end_index?: number;
  },
): T[] | null {
  if (points.length < 2) return null;

  const startIdx =
    draft.start_index ?? nearestTrackPointIndex(points, draft.start_lat, draft.start_lon);
  const endIdx = draft.end_index ?? nearestTrackPointIndex(points, draft.end_lat, draft.end_lon);
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return null;
  return points.slice(startIdx, endIdx + 1);
}