import type { GeoPoint, Stretch, StretchThresholds } from "../types";
import {
  stretchAvgGradePct,
  stretchElevationDelta,
  stretchKindFromGrade,
} from "../stretchUtils";
import { haversineM } from "./geo/haversine";

export type PathPoint = {
  lat: number;
  lon: number;
  elevation_m: number;
};

export type PathContext = {
  points: PathPoint[];
  distances: number[];
};

export type MergeDirection = "left" | "right";

export type MergeResult = {
  stretches: Stretch[];
  selectedIndex: number;
};

export type SplitResult = {
  stretches: Stretch[];
  selectedIndex: number;
};

const MIN_LENGTH_FLOOR_M = 1;

const minStretchLengthM = (thresholds: StretchThresholds): number =>
  Math.max(MIN_LENGTH_FLOOR_M, thresholds.min_stretch_m);

export const reindexStretches = (stretches: Stretch[]): Stretch[] =>
  stretches.map((stretch, index) => ({ ...stretch, index }));

export const enrichStretchGeometry = (
  partial: Pick<Stretch, "start" | "end" | "length_m"> & {
    index: number;
    name?: string | null;
  },
  thresholds: StretchThresholds,
): Stretch => {
  const elevation_delta_m = stretchElevationDelta(partial);
  const avg_grade_pct = stretchAvgGradePct(partial);
  return {
    index: partial.index,
    start: partial.start,
    end: partial.end,
    length_m: partial.length_m,
    name: partial.name ?? null,
    elevation_delta_m,
    avg_grade_pct,
    kind: stretchKindFromGrade(avg_grade_pct, thresholds),
  };
};

/** 1-based display number for UI (storage index stays 0-based). */
export const stretchDisplayNumber = (index: number): number => index + 1;

/** Label for lists/strip: custom name or "Climb 1" / "Flat 2" style. */
export const stretchDisplayName = (stretch: Stretch): string => {
  const trimmed = stretch.name?.trim();
  if (trimmed) return trimmed;
  const kind =
    stretch.kind === "climb"
      ? "Climb"
      : stretch.kind === "descent"
        ? "Descent"
        : "Flat";
  return `${kind} ${stretchDisplayNumber(stretch.index)}`;
};

export const pointAtPathDistance = (
  path: PathContext,
  targetDist: number,
): GeoPoint | null => {
  const { points, distances } = path;
  if (points.length === 0 || distances.length === 0) return null;

  const total = distances[distances.length - 1] ?? 0;
  const clamped = Math.max(0, Math.min(targetDist, total));

  if (clamped <= 0) {
    const p = points[0];
    return { lat: p.lat, lon: p.lon, elevation_m: p.elevation_m };
  }
  if (clamped >= total) {
    const p = points[points.length - 1];
    return { lat: p.lat, lon: p.lon, elevation_m: p.elevation_m };
  }

  let hi = 1;
  while (hi < distances.length && distances[hi] < clamped) hi += 1;
  const lo = hi - 1;
  const span = distances[hi] - distances[lo];
  const t = span > 0 ? (clamped - distances[lo]) / span : 0;
  const a = points[lo];
  const b = points[hi];
  return {
    lat: a.lat + t * (b.lat - a.lat),
    lon: a.lon + t * (b.lon - a.lon),
    elevation_m: a.elevation_m + t * (b.elevation_m - a.elevation_m),
  };
};

/** Project a geo point onto the path; return cumulative distance along the path. */
const nearestPathDistance = (path: PathContext, point: GeoPoint): number => {
  const { points, distances } = path;
  if (!points.length) return 0;
  if (points.length === 1) return distances[0] ?? 0;

  let bestDist = 0;
  let bestMeters = Number.POSITIVE_INFINITY;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const abLat = b.lat - a.lat;
    const abLon = b.lon - a.lon;
    const ab2 = abLat * abLat + abLon * abLon;
    const t =
      ab2 > 0
        ? Math.max(
            0,
            Math.min(1, ((point.lat - a.lat) * abLat + (point.lon - a.lon) * abLon) / ab2),
          )
        : 0;
    const projLat = a.lat + t * abLat;
    const projLon = a.lon + t * abLon;
    const d = haversineM(point.lat, point.lon, projLat, projLon);
    if (d < bestMeters) {
      bestMeters = d;
      const segStart = distances[i] ?? 0;
      const segEnd = distances[i + 1] ?? segStart;
      bestDist = segStart + t * (segEnd - segStart);
    }
  }
  return bestDist;
};

export const projectStretchBoundaries = (
  stretches: Stretch[],
  path: PathContext,
): number[] => {
  if (!stretches.length) return [];
  const bounds = stretches.map((s) => nearestPathDistance(path, s.start));
  bounds.push(nearestPathDistance(path, stretches[stretches.length - 1].end));
  return bounds;
};

const rebuildFromBoundaries = (
  boundaries: number[],
  path: PathContext,
  thresholds: StretchThresholds,
): Stretch[] | null => {
  if (boundaries.length < 2) return null;
  const stretches: Stretch[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const startDist = boundaries[i];
    const endDist = boundaries[i + 1];
    if (endDist - startDist < MIN_LENGTH_FLOOR_M) return null;
    const start = pointAtPathDistance(path, startDist);
    const end = pointAtPathDistance(path, endDist);
    if (!start || !end) return null;
    stretches.push(
      enrichStretchGeometry(
        {
          index: i,
          start,
          end,
          length_m: endDist - startDist,
        },
        thresholds,
      ),
    );
  }
  return reindexStretches(stretches);
};

export const mergeStretches = (
  stretches: Stretch[],
  selectedIndex: number,
  direction: MergeDirection,
  thresholds: StretchThresholds,
): MergeResult | null => {
  if (selectedIndex < 0 || selectedIndex >= stretches.length) return null;
  const otherIndex = direction === "left" ? selectedIndex - 1 : selectedIndex + 1;
  if (otherIndex < 0 || otherIndex >= stretches.length) return null;

  const leftIndex = Math.min(selectedIndex, otherIndex);
  const rightIndex = Math.max(selectedIndex, otherIndex);
  const left = stretches[leftIndex];
  const right = stretches[rightIndex];
  const merged = enrichStretchGeometry(
    {
      index: leftIndex,
      start: left.start,
      end: right.end,
      length_m: left.length_m + right.length_m,
      name: left.name?.trim() || right.name?.trim() || null,
    },
    thresholds,
  );

  const next = [
    ...stretches.slice(0, leftIndex),
    merged,
    ...stretches.slice(rightIndex + 1),
  ];
  return {
    stretches: reindexStretches(next),
    selectedIndex: leftIndex,
  };
};

export const splitStretch = (
  stretches: Stretch[],
  selectedIndex: number,
  path: PathContext,
  thresholds: StretchThresholds,
  cutDistanceM?: number,
): SplitResult | null => {
  if (selectedIndex < 0 || selectedIndex >= stretches.length) return null;
  const target = stretches[selectedIndex];
  const startDist = nearestPathDistance(path, target.start);
  const endDist = nearestPathDistance(path, target.end);
  if (endDist - startDist < minStretchLengthM(thresholds) * 2) return null;

  const mid = (startDist + endDist) / 2;
  const cut = cutDistanceM ?? mid;
  const minLen = minStretchLengthM(thresholds);
  if (cut - startDist < minLen || endDist - cut < minLen) return null;

  const cutPoint = pointAtPathDistance(path, cut);
  if (!cutPoint) return null;

  const left = enrichStretchGeometry(
    {
      index: selectedIndex,
      start: target.start,
      end: cutPoint,
      length_m: cut - startDist,
      name: target.name ?? null,
    },
    thresholds,
  );
  const right = enrichStretchGeometry(
    {
      index: selectedIndex + 1,
      start: cutPoint,
      end: target.end,
      length_m: endDist - cut,
      name: null,
    },
    thresholds,
  );

  const next = [
    ...stretches.slice(0, selectedIndex),
    left,
    right,
    ...stretches.slice(selectedIndex + 1),
  ];
  return {
    stretches: reindexStretches(next),
    selectedIndex,
  };
};

/**
 * Move the boundary at `boundaryIndex` (0 = start of first stretch, n = end of last).
 * Interior boundaries (1..n-1) adjust two adjacent stretches.
 */
export const moveBoundary = (
  stretches: Stretch[],
  boundaryIndex: number,
  targetDistanceM: number,
  path: PathContext,
  thresholds: StretchThresholds,
): Stretch[] | null => {
  if (stretches.length === 0) return null;
  const bounds = projectStretchBoundaries(stretches, path);
  if (boundaryIndex <= 0 || boundaryIndex >= bounds.length - 1) return null;

  const minLen = minStretchLengthM(thresholds);
  const lo = bounds[boundaryIndex - 1] + minLen;
  const hi = bounds[boundaryIndex + 1] - minLen;
  if (lo > hi) return null;

  const nextBounds = bounds.slice();
  nextBounds[boundaryIndex] = Math.max(lo, Math.min(hi, targetDistanceM));
  return rebuildFromBoundaries(nextBounds, path, thresholds);
};

export type ShortStretchNudge = {
  index: number;
  length_m: number;
  canMergeLeft: boolean;
  canMergeRight: boolean;
};

/**
 * After boundary edit, find stretches at/under min length that still have a
 * neighbor to merge into (soft nudge, not auto-merge).
 */
export const findShortStretchNudges = (
  stretches: Stretch[],
  minLengthM: number,
  /** Optional focus set (e.g. prev/selected/next indices). */
  candidateIndices?: ReadonlyArray<number>,
): ShortStretchNudge[] => {
  if (!stretches.length || minLengthM <= 0) return [];
  const indices =
    candidateIndices ?? stretches.map((_, i) => i);
  const unique = [...new Set(indices)].filter(
    (i) => i >= 0 && i < stretches.length,
  );
  return unique
    .filter((i) => stretches[i].length_m <= minLengthM + 0.5)
    .map((i) => ({
      index: i,
      length_m: stretches[i].length_m,
      canMergeLeft: i > 0,
      canMergeRight: i < stretches.length - 1,
    }))
    .filter((n) => n.canMergeLeft || n.canMergeRight);
};

export const buildPathContext = (
  points: Array<{ lat: number; lon: number; elevation_m?: number | null }>,
): PathContext | null => {
  if (points.length < 2) return null;
  const pathPoints: PathPoint[] = points.map((p) => ({
    lat: p.lat,
    lon: p.lon,
    elevation_m: p.elevation_m ?? 0,
  }));
  const distances = [0];
  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1];
    const cur = pathPoints[i];
    distances.push(
      distances[i - 1] + haversineM(prev.lat, prev.lon, cur.lat, cur.lon),
    );
  }
  return { points: pathPoints, distances };
};
