import { haversineM } from "../geo/haversine.js";
import { elevationGainM, pathDistanceM } from "../geo/pathMetrics.js";
import type { SegmentMatch } from "../types.js";

export interface TrackPointRow {
  lat: number;
  lon: number;
  elevation_m: number | null;
  heart_rate: number | null;
  speed_mps: number | null;
  distance_m?: number | null;
  timestamp: string | null;
}

export interface SegmentDefinition {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m: number;
  match_threshold: number;
}

export interface SegmentPassResult extends SegmentMatch {
  matched: true;
  passNumber: number;
  matchScore: number;
  startIndex: number;
  endIndex: number;
}

function speedKmh(speedMps: number | null): number | null {
  return speedMps == null ? null : speedMps * 3.6;
}

function resamplePoints(points: TrackPointRow[], targetCount: number): TrackPointRow[] {
  if (points.length === 0 || targetCount <= 0) return [];
  if (targetCount === 1) return [points[0]];
  if (points.length === 1) {
    return Array.from({ length: targetCount }, () => points[0]);
  }

  const result: TrackPointRow[] = [];
  const step = (points.length - 1) / (targetCount - 1);
  for (let i = 0; i < targetCount; i++) {
    result.push(points[Math.round(i * step)]);
  }
  return result;
}

/**
 * Shape similarity in [0, 1]. Optional `minScore` enables early exit when the
 * best possible remaining score cannot meet the threshold.
 */
export function shapeMatchScore(
  reference: TrackPointRow[],
  candidate: TrackPointRow[],
  toleranceM: number,
  minScore = 0,
): number {
  if (reference.length < 2 || candidate.length < 2 || toleranceM <= 0) return 0;

  const ref = resamplePoints(reference, 50);
  let totalDist = 0;
  const n = ref.length;

  for (let i = 0; i < n; i++) {
    const r = ref[i];
    let minDist = Infinity;
    for (const c of candidate) {
      const d = haversineM(r.lat, r.lon, c.lat, c.lon);
      if (d < minDist) minDist = d;
    }
    totalDist += minDist;

    // Best possible score if remaining distances are 0:
    // score = 1 - (totalDist / n) / toleranceM
    if (minScore > 0) {
      const bestPossible = 1 - totalDist / (n * toleranceM);
      if (bestPossible < minScore) return 0;
    }
  }

  const avgDist = totalDist / n;
  return Math.max(0, Math.min(1, 1 - avgDist / toleranceM));
}

const isInsideStartRadius = (
  point: TrackPointRow,
  segment: SegmentDefinition,
): boolean =>
  haversineM(point.lat, point.lon, segment.start_lat, segment.start_lon) <= segment.radius_m;

/**
 * On out-and-back routes the start gate is often hit twice. Keep the return-leg entry
 * and drop everything before it (e.g. still climbing on the way up).
 */
export const trimStartAtReturnLeg = (
  points: TrackPointRow[],
  startIdx: number,
  endIdx: number,
  segment: SegmentDefinition,
): number => {
  if (startIdx >= endIdx) return startIdx;

  const regions: Array<{ start: number; end: number }> = [];
  let inRegion = false;
  let regionStart = startIdx;

  for (let i = startIdx; i <= endIdx; i++) {
    const inside = isInsideStartRadius(points[i], segment);
    if (inside && !inRegion) {
      inRegion = true;
      regionStart = i;
    } else if (!inside && inRegion) {
      regions.push({ start: regionStart, end: i - 1 });
      inRegion = false;
    }
  }

  if (inRegion) {
    regions.push({ start: regionStart, end: endIdx });
  }

  return regions.length >= 2 ? regions[1].start : startIdx;
};

export type PassBuildInput = {
  slice: TrackPointRow[];
  startIndex: number;
  endIndex: number;
  passNumber: number;
  matchScore: number;
};

export const buildPassResult = ({
  slice,
  startIndex,
  endIndex,
  passNumber,
  matchScore,
}: PassBuildInput): SegmentPassResult => {
  let durationSec: number | null = null;
  if (slice[0].timestamp && slice.at(-1)?.timestamp) {
    durationSec =
      (new Date(slice.at(-1)!.timestamp!).getTime() - new Date(slice[0].timestamp!).getTime()) / 1000;
  }

  const distanceM = pathDistanceM(slice);
  let speedTotal = 0;
  let speedCount = 0;
  let maxSpeedKmh: number | null = null;
  let heartRateTotal = 0;
  let heartRateCount = 0;
  let maxHr: number | null = null;

  for (const point of slice) {
    const speed = speedKmh(point.speed_mps);
    if (speed != null) {
      speedTotal += speed;
      speedCount += 1;
      maxSpeedKmh = maxSpeedKmh == null ? speed : Math.max(maxSpeedKmh, speed);
    }
    if (point.heart_rate != null) {
      heartRateTotal += point.heart_rate;
      heartRateCount += 1;
      maxHr = maxHr == null ? point.heart_rate : Math.max(maxHr, point.heart_rate);
    }
  }

  let avgSpeedKmh: number | null = speedCount ? speedTotal / speedCount : null;
  if (avgSpeedKmh == null && durationSec && durationSec > 0) {
    avgSpeedKmh = (distanceM / durationSec) * 3.6;
  }
  const avgHr = heartRateCount ? heartRateTotal / heartRateCount : null;

  return {
    matched: true,
    passNumber,
    matchScore,
    startIndex,
    endIndex,
    durationSec,
    distanceM,
    avgSpeedKmh,
    maxSpeedKmh,
    avgHr,
    maxHr,
    elevationGainM: elevationGainM(slice),
  };
};

export function findAllSegmentPasses(
  points: TrackPointRow[],
  segment: SegmentDefinition,
  reference: TrackPointRow[],
): SegmentPassResult[] {
  if (points.length < 2 || reference.length < 2) return [];

  const passes: SegmentPassResult[] = [];
  const toleranceM = Math.max(segment.radius_m * 2, 40);
  let scanFrom = 0;
  let passNumber = 0;

  while (scanFrom < points.length - 1) {
    let startIdx: number | null = null;
    let endIdx: number | null = null;

    for (let i = scanFrom; i < points.length; i++) {
      const point = points[i];
      const distStart = haversineM(point.lat, point.lon, segment.start_lat, segment.start_lon);
      const distEnd = haversineM(point.lat, point.lon, segment.end_lat, segment.end_lon);

      if (startIdx == null) {
        if (distStart <= segment.radius_m) startIdx = i;
      } else if (distEnd <= segment.radius_m) {
        endIdx = i;
        break;
      }
    }

    if (startIdx == null) break;
    if (endIdx == null || endIdx <= startIdx) {
      scanFrom = startIdx + 1;
      continue;
    }

    const effectiveStart = trimStartAtReturnLeg(points, startIdx, endIdx, segment);
    const slice = points.slice(effectiveStart, endIdx + 1);
    if (slice.length >= 2) {
      const score = shapeMatchScore(reference, slice, toleranceM, segment.match_threshold);
      if (score >= segment.match_threshold) {
        passNumber += 1;
        passes.push(
          buildPassResult({
            slice,
            startIndex: effectiveStart,
            endIndex: endIdx,
            passNumber,
            matchScore: score,
          }),
        );
        scanFrom = endIdx + 1;
        continue;
      }
    }

    scanFrom = startIdx + 1;
  }

  return passes;
}
