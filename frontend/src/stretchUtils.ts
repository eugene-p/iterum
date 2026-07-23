import type {
  SegmentPass,
  SegmentStretchPreviewOptions,
  Stretch,
  StretchKind,
  StretchThresholds,
  TrackPoint,
} from "./types";
import { haversineM } from "./lib/geo/haversine";
import { DEFAULT_STRETCH_THRESHOLDS } from "./lib/stretchThresholds";
import {
  cumulativeDistances,
  metricsAtIndex,
  sliceDurationSec,
} from "./routeExplorerUtils";

export { cumulativeDistances };

export { DEFAULT_STRETCH_THRESHOLDS };

export function stretchElevationDelta(stretch: Pick<Stretch, "start" | "end">): number {
  return stretch.end.elevation_m - stretch.start.elevation_m;
}

export function stretchAvgGradePct(stretch: Pick<Stretch, "length_m" | "start" | "end">): number {
  if (stretch.length_m <= 0) return 0;
  return (stretchElevationDelta(stretch) / stretch.length_m) * 100;
}

export function stretchKindFromGrade(
  avgGradePct: number,
  thresholds: StretchThresholds,
): StretchKind {
  if (avgGradePct >= thresholds.climb_grade_pct) return "climb";
  if (avgGradePct <= thresholds.descent_grade_pct) return "descent";
  return "flat";
}

export function speedKmhFromDistance(
  duration_sec: number | null,
  distance_m: number,
): number | null {
  if (duration_sec == null || duration_sec <= 0 || distance_m <= 0) return null;
  return (distance_m / duration_sec) * 3.6;
}

export function formatElevationDelta(delta_m: number): string {
  const rounded = Math.round(delta_m);
  if (rounded > 0) return `+${rounded} m`;
  if (rounded < 0) return `${rounded} m`;
  return "0 m";
}

export type ComparisonBaseline = {
  distance_m: number;
  elevation_delta_m: number | null;
};

export function comparisonBaselineFromPoints(points: TrackPoint[]): ComparisonBaseline | null {
  if (points.length < 2) return null;
  const dists = cumulativeDistances(points);
  const distance_m = dists[dists.length - 1] ?? 0;
  if (distance_m <= 0) return null;
  const startElev = points[0].elevation_m;
  const endElev = points[points.length - 1].elevation_m;
  return {
    distance_m,
    elevation_delta_m:
      startElev != null && endElev != null ? endElev - startElev : null,
  };
}

export function comparisonBaselineFromStretch(stretch: Stretch): ComparisonBaseline {
  return {
    distance_m: stretch.length_m,
    elevation_delta_m: stretch.elevation_delta_m,
  };
}

export function comparisonBaselineFromStretches(stretches: Stretch[]): ComparisonBaseline | null {
  if (!stretches.length) return null;
  const distance_m = stretches.reduce((sum, stretch) => sum + stretch.length_m, 0);
  if (distance_m <= 0) return null;
  return {
    distance_m,
    elevation_delta_m: stretches.reduce((sum, stretch) => sum + stretch.elevation_delta_m, 0),
  };
}

export function stretchKindLabel(kind: StretchKind): string {
  if (kind === "climb") return "Climb";
  if (kind === "descent") return "Descent";
  return "Flat";
}

function nearestIndexOnPass(
  points: TrackPoint[],
  lat: number,
  lon: number,
  minIndex = 0,
): number {
  let bestIdx = minIndex;
  let bestDist = Infinity;
  for (let i = minIndex; i < points.length; i++) {
    const dist = haversineM(points[i].lat, points[i].lon, lat, lon);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function stretchIndicesOnPass(
  points: TrackPoint[],
  stretch: Stretch,
): { startIdx: number; endIdx: number } {
  if (!points.length) return { startIdx: 0, endIdx: 0 };
  const startIdx = nearestIndexOnPass(points, stretch.start.lat, stretch.start.lon, 0);
  const endIdx = nearestIndexOnPass(points, stretch.end.lat, stretch.end.lon, startIdx);
  return { startIdx, endIdx };
}

export function stretchAtIndex(
  stretches: Stretch[],
  points: TrackPoint[],
  index: number,
): Stretch | null {
  if (!stretches.length || !points.length || index < 0) return null;
  for (const stretch of stretches) {
    const { startIdx, endIdx } = stretchIndicesOnPass(points, stretch);
    if (index >= startIdx && index <= endIdx) return stretch;
  }
  return null;
}

export function stretchAtFraction(
  stretches: Stretch[],
  points: TrackPoint[],
  fraction: number,
): Stretch | null {
  if (!stretches.length || !points.length) return null;
  if (points.length <= 1) return stretches[0] ?? null;
  const index = Math.round(Math.min(1, Math.max(0, fraction)) * (points.length - 1));
  return stretchAtIndex(stretches, points, index);
}

export type StretchPointContext = {
  stretch: Stretch | null;
  stretchElapsedSec: number | null;
  stretchDistanceM: number | null;
};

export function stretchPointContextAtIndex(
  points: TrackPoint[],
  stretch: Stretch | null,
  index: number,
  durationSec?: number | null,
): StretchPointContext {
  if (!stretch || !points.length || index < 0) {
    return { stretch: null, stretchElapsedSec: null, stretchDistanceM: null };
  }

  const { startIdx } = stretchIndicesOnPass(points, stretch);
  const current = metricsAtIndex(points, index, durationSec);
  const stretchStart = metricsAtIndex(points, startIdx, durationSec);
  if (!current || !stretchStart) {
    return { stretch, stretchElapsedSec: null, stretchDistanceM: null };
  }

  return {
    stretch,
    stretchElapsedSec:
      current.elapsedSec != null && stretchStart.elapsedSec != null
        ? Math.max(0, current.elapsedSec - stretchStart.elapsedSec)
        : null,
    stretchDistanceM: Math.max(0, current.distanceM - stretchStart.distanceM),
  };
}

export function formatStretchLabel(stretch: Stretch): string {
  return `${stretchKindLabel(stretch.kind)} #${stretch.index}`;
}

export const STRETCH_PROGRESS_COLORS = ["#7dffb0", "#f5c542", "#ff8f8f", "#4a4a4a"] as const;

export function segmentFractionAtIndex(points: TrackPoint[], index: number): number {
  if (points.length <= 1) return 0;
  return Math.min(1, Math.max(0, index / (points.length - 1)));
}

export function stretchProgressScore(
  stretches: Stretch[],
  points: TrackPoint[],
  fraction: number,
): number {
  if (!stretches.length || !points.length) return fraction;
  const stretch = stretchAtFraction(stretches, points, fraction);
  if (!stretch) return fraction * 0.001;
  const { startIdx, endIdx } = stretchIndicesOnPass(points, stretch);
  const index = Math.round(Math.min(1, Math.max(0, fraction)) * (points.length - 1));
  const span = endIdx - startIdx;
  const within = span > 0 ? (index - startIdx) / span : 1;
  return stretch.index + within * 0.999;
}

export function rankFromLeaderTiers(values: number[], value: number, higherIsAhead = true): number {
  const tiers = [...new Set(values)].sort((a, b) => (higherIsAhead ? b - a : a - b));
  const rank = tiers.indexOf(value);
  return rank < 0 ? tiers.length - 1 : rank;
}

export function stretchProgressColor(rankFromLeader: number): string {
  return STRETCH_PROGRESS_COLORS[
    Math.min(Math.max(0, rankFromLeader), STRETCH_PROGRESS_COLORS.length - 1)
  ];
}

export function stretchProgressRankColor(
  values: number[],
  value: number,
  higherIsAhead = true,
): string {
  return stretchProgressColor(rankFromLeaderTiers(values, value, higherIsAhead));
}

export function stretchKindColor(kind: StretchKind): string {
  if (kind === "climb") return "#ff8f6b";
  if (kind === "descent") return "#c084fc";
  return "#5eead4";
}

export function slicePointsByDistance(
  points: TrackPoint[],
  startDistanceM: number,
  endDistanceM: number,
): TrackPoint[] {
  if (points.length < 2) return points.slice();
  const dists = cumulativeDistances(points);
  const startIdx = dists.findIndex((d) => d >= startDistanceM);
  let endIdx = dists.length - 1;
  for (let i = dists.length - 1; i >= 0; i--) {
    if (dists[i] <= endDistanceM) {
      endIdx = i;
      break;
    }
  }
  const from = startIdx < 0 ? 0 : startIdx;
  const to = Math.max(from, endIdx);
  return points.slice(from, to + 1);
}

export function stretchPathSlices(
  points: TrackPoint[],
  stretches: Stretch[],
): Array<{ stretch: Stretch; points: TrackPoint[] }> {
  if (!points.length || !stretches.length) return [];
  return stretches.map((stretch) => ({
    stretch,
    points: slicePointsByStretch(points, stretch),
  }));
}

export function stretchThresholdQuery(thresholds: StretchThresholds): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(thresholds)) {
    params.set(key, String(value));
  }
  return params.toString();
}

const THRESHOLD_KEYS = Object.keys(DEFAULT_STRETCH_THRESHOLDS) as Array<keyof StretchThresholds>;

export function thresholdsEqual(
  left: StretchThresholds | null | undefined,
  right: StretchThresholds | null | undefined,
): boolean {
  if (!left || !right) return false;
  return THRESHOLD_KEYS.every((key) => left[key] === right[key]);
}

export type SavedStretchBaseline = {
  stretchSourceActivityId: number;
  thresholds: StretchThresholds;
};

export function isStretchPreviewDirty(
  preview: SegmentStretchPreviewOptions,
  baseline: SavedStretchBaseline,
): boolean {
  if (
    preview.stretchSourceActivityId != null &&
    preview.stretchSourceActivityId !== baseline.stretchSourceActivityId
  ) {
    return true;
  }
  if (preview.thresholds && !thresholdsEqual(baseline.thresholds, preview.thresholds)) {
    return true;
  }
  return false;
}

export function stretchPreviewQuery(preview: SegmentStretchPreviewOptions): string {
  const params = new URLSearchParams();
  if (preview.thresholds) {
    for (const [key, value] of Object.entries(preview.thresholds)) {
      params.set(key, String(value));
    }
  }
  if (preview.stretchSourceActivityId != null) {
    params.set("stretch_source_activity_id", String(preview.stretchSourceActivityId));
  }
  return params.toString();
}

export type StretchPassMetrics = {
  pass: SegmentPass;
  distance_m: number;
  duration_sec: number | null;
  avg_speed_kmh: number | null;
  avg_hr: number | null;
  elevation_gain_m: number | null;
};

export function slicePassPoints(allPoints: TrackPoint[], pass: SegmentPass): TrackPoint[] {
  if (pass.start_index == null || pass.end_index == null) return [];
  return allPoints.slice(pass.start_index, pass.end_index + 1);
}

export function slicePointsByStretch(points: TrackPoint[], stretch: Stretch): TrackPoint[] {
  if (!points.length) return [];
  const { startIdx, endIdx } = stretchIndicesOnPass(points, stretch);
  return points.slice(startIdx, endIdx + 1);
}

function elevationGain(points: TrackPoint[]): number | null {
  const elevations = points.map((p) => p.elevation_m).filter((e): e is number => e != null);
  if (elevations.length < 2) return null;
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1];
    if (delta > 0) gain += delta;
  }
  return gain;
}

export function computeStretchPassMetrics(
  stretch: Stretch,
  passPoints: TrackPoint[],
  passDurationSec?: number | null,
): Omit<StretchPassMetrics, "pass"> {
  const slice = slicePointsByStretch(passPoints, stretch);
  if (slice.length < 2) {
    return {
      distance_m: 0,
      duration_sec: null,
      avg_speed_kmh: null,
      avg_hr: null,
      elevation_gain_m: null,
    };
  }

  const dists = cumulativeDistances(slice);
  const distance_m = Math.max(0, (dists[dists.length - 1] ?? 0) - (dists[0] ?? 0));

  let duration_sec = sliceDurationSec(slice);
  if (duration_sec == null && passDurationSec != null && passDurationSec > 0 && passPoints.length >= 2) {
    const passDists = cumulativeDistances(passPoints);
    const passTotal = passDists[passDists.length - 1] ?? 0;
    if (passTotal > 0) {
      duration_sec = passDurationSec * (distance_m / passTotal);
    }
  }

  const speeds = slice
    .map((p) => (p.speed_mps != null ? p.speed_mps * 3.6 : null))
    .filter((s): s is number => s != null);
  let avg_speed_kmh = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;
  if (avg_speed_kmh == null && duration_sec != null && duration_sec > 0) {
    avg_speed_kmh = (distance_m / duration_sec) * 3.6;
  }

  const heartRates = slice.map((p) => p.heart_rate).filter((hr): hr is number => hr != null);
  const avg_hr = heartRates.length ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : null;

  return {
    distance_m,
    duration_sec,
    avg_speed_kmh,
    avg_hr,
    elevation_gain_m: elevationGain(slice),
  };
}

export function buildStretchPassMetrics(
  stretch: Stretch,
  passes: SegmentPass[],
  tracks: Record<number, TrackPoint[]>,
): StretchPassMetrics[] {
  return passes
    .filter((pass) => pass.matched && pass.start_index != null && pass.end_index != null)
    .map((pass) => {
      const passPoints = slicePassPoints(tracks[pass.activity_id] ?? [], pass);
      const metrics = computeStretchPassMetrics(stretch, passPoints, pass.duration_sec);
      return { pass, ...metrics };
    })
    .filter((row) => row.distance_m > 0);
}