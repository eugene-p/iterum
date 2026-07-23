import type { SegmentPass, TrackPoint } from "./types";
import type { StretchPointContext } from "./stretchUtils";
import { formatStretchLabel } from "./stretchUtils";
import { formatDuration, formatHr, formatPaceFromSpeed, formatSpeed, haversineM } from "./utils";

export type ExplorerPointMetrics = {
  index: number;
  point: TrackPoint;
  elapsedSec: number | null;
  distanceM: number;
  speedKmh: number | null;
};

export type ExplorerPassSlice = {
  pass: SegmentPass;
  points: TrackPoint[];
  durationSec: number | null;
};

function parseTimestamp(ts: string | null | undefined): number | null {
  if (!ts) return null;
  const t = new Date(ts).getTime();
  return Number.isNaN(t) ? null : t;
}

export function pointsHaveTimestamps(points: TrackPoint[]): boolean {
  return points.some((p) => parseTimestamp(p.timestamp) != null);
}

export function effectiveDurationSec(
  points: TrackPoint[],
  durationSec?: number | null,
): number | null {
  if (durationSec != null && durationSec > 0) return durationSec;
  return sliceDurationSec(points);
}

export function hasTimingData(points: TrackPoint[], durationSec?: number | null): boolean {
  return effectiveDurationSec(points, durationSec) != null || pointsHaveTimestamps(points);
}

/** WeakMap cache: same track array identity reuses O(n) haversine walk. */
const cumulativeDistanceCache = new WeakMap<TrackPoint[], number[]>();

export function cumulativeDistances(points: TrackPoint[]): number[] {
  const cached = cumulativeDistanceCache.get(points);
  if (cached) return cached;

  const dists = [0];
  for (let i = 1; i < points.length; i++) {
    dists.push(
      dists[i - 1] + haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon),
    );
  }
  cumulativeDistanceCache.set(points, dists);
  return dists;
}

export function sliceDurationSec(points: TrackPoint[]): number | null {
  if (points.length < 2) return null;
  const start = parseTimestamp(points[0]?.timestamp);
  const end = parseTimestamp(points[points.length - 1]?.timestamp);
  if (start == null || end == null) return null;
  return Math.max(0, (end - start) / 1000);
}

export function elapsedSecAtIndex(
  points: TrackPoint[],
  index: number,
  durationSec?: number | null,
): number | null {
  if (!points.length || index < 0) return null;
  const start = parseTimestamp(points[0]?.timestamp);
  const current = parseTimestamp(points[Math.min(index, points.length - 1)]?.timestamp);
  if (start != null && current != null) {
    return Math.max(0, (current - start) / 1000);
  }
  const duration = effectiveDurationSec(points, durationSec);
  if (duration == null || points.length <= 1) return null;
  return (index / (points.length - 1)) * duration;
}

export function indexAtElapsedSec(
  points: TrackPoint[],
  elapsedSec: number,
  durationSec?: number | null,
): number {
  if (!points.length) return 0;
  if (points.length === 1) return 0;

  const startTs = parseTimestamp(points[0]?.timestamp);
  if (startTs == null) {
    const duration = effectiveDurationSec(points, durationSec);
    const fraction = duration && duration > 0 ? Math.min(1, elapsedSec / duration) : 0;
    return Math.round(fraction * (points.length - 1));
  }

  const target = startTs + elapsedSec * 1000;
  let bestIdx = 0;
  for (let i = 0; i < points.length; i++) {
    const ts = parseTimestamp(points[i].timestamp);
    if (ts == null) continue;
    if (ts <= target) bestIdx = i;
    else break;
  }
  return bestIdx;
}

export function indexAtRelativePosition(points: TrackPoint[], fraction: number): number {
  if (!points.length) return 0;
  const clamped = Math.min(1, Math.max(0, fraction));
  return Math.round(clamped * (points.length - 1));
}

export function metricsAtIndex(
  points: TrackPoint[],
  index: number,
  durationSec?: number | null,
): ExplorerPointMetrics | null {
  if (!points.length || index < 0 || index >= points.length) return null;
  const dists = cumulativeDistances(points);
  const point = points[index];
  const speedKmh = point.speed_mps != null ? point.speed_mps * 3.6 : null;
  return {
    index,
    point,
    elapsedSec: elapsedSecAtIndex(points, index, durationSec),
    distanceM: dists[index] ?? 0,
    speedKmh,
  };
}

export function slicePassPoints(allPoints: TrackPoint[], pass: SegmentPass): TrackPoint[] {
  if (pass.start_index == null || pass.end_index == null) return [];
  return allPoints.slice(pass.start_index, pass.end_index + 1);
}

export function buildPassSlices(
  passes: SegmentPass[],
  tracks: Record<number, TrackPoint[]>,
): ExplorerPassSlice[] {
  return passes
    .filter((p) => p.matched && p.start_index != null && p.end_index != null)
    .map((pass) => {
      const points = slicePassPoints(tracks[pass.activity_id] ?? [], pass);
      return {
        pass,
        points,
        durationSec: pass.duration_sec ?? sliceDurationSec(points),
      };
    })
    .filter((s) => s.points.length > 0);
}

export function maxDurationAmongSlices(slices: ExplorerPassSlice[]): number {
  let max = 0;
  for (const slice of slices) {
    const d = slice.durationSec ?? sliceDurationSec(slice.points) ?? 0;
    if (d > max) max = d;
  }
  return max;
}

export function timeSliderStep(maxDurationSec: number): number {
  if (maxDurationSec <= 0) return 1;
  return Math.max(1, Math.round(maxDurationSec / 200));
}

export function formatDistanceShort(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function hasSpeed(kmh: number | null | undefined): boolean {
  return kmh != null && kmh > 0;
}

export function formatMetricsLine(metrics: ExplorerPointMetrics | null): string {
  if (!metrics) return "—";
  const parts: string[] = [];
  if (metrics.elapsedSec != null) parts.push(formatDuration(metrics.elapsedSec));
  parts.push(formatHr(metrics.point.heart_rate));
  if (hasSpeed(metrics.speedKmh)) {
    parts.push(formatSpeed(metrics.speedKmh));
    parts.push(formatPaceFromSpeed(metrics.speedKmh));
  }
  parts.push(
    metrics.point.elevation_m != null ? `${Math.round(metrics.point.elevation_m)} m` : "—",
    formatDistanceShort(metrics.distanceM),
  );
  return parts.join(" · ");
}

export function formatExplorerPassMetrics(
  metrics: ExplorerPointMetrics | null,
  stretchContext?: StretchPointContext | null,
): string {
  if (!metrics) return "—";
  const parts: string[] = [];
  if (stretchContext?.stretch) {
    parts.push(formatStretchLabel(stretchContext.stretch));
    if (stretchContext.stretchElapsedSec != null) {
      parts.push(formatDuration(stretchContext.stretchElapsedSec));
    }
    if (stretchContext.stretchDistanceM != null) {
      parts.push(formatDistanceShort(stretchContext.stretchDistanceM));
    }
  } else if (metrics.elapsedSec != null) {
    parts.push(formatDuration(metrics.elapsedSec));
  }
  parts.push(formatHr(metrics.point.heart_rate));
  if (hasSpeed(metrics.speedKmh)) {
    parts.push(formatSpeed(metrics.speedKmh));
    parts.push(formatPaceFromSpeed(metrics.speedKmh));
  }
  parts.push(
    metrics.point.elevation_m != null ? `${Math.round(metrics.point.elevation_m)} m` : "—",
  );
  if (!stretchContext?.stretch) {
    parts.push(formatDistanceShort(metrics.distanceM));
  }
  return parts.join(" · ");
}