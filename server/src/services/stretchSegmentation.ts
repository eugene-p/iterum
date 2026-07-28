import {
  DEFAULT_STRETCH_THRESHOLDS,
  parseStretchThresholds,
  type StretchThresholds,
} from "@eugene-p/iterum-shared";
import type { GeoPoint } from "../db/geoPoint.js";
import { cumulativeDistancesM } from "../geo/pathMetrics.js";

export type StretchKind = "climb" | "flat" | "descent";
export type { StretchThresholds };
export { DEFAULT_STRETCH_THRESHOLDS, parseStretchThresholds };

export interface StretchPoint {
  lat: number;
  lon: number;
  elevation_m: number | null;
}

export interface StoredStretch {
  index: number;
  start: GeoPoint;
  end: GeoPoint;
  length_m: number;
}

export interface Stretch extends StoredStretch {
  kind: StretchKind;
  elevation_delta_m: number;
  avg_grade_pct: number;
}

export const stretchElevationDelta = (stretch: StoredStretch): number =>
  (stretch.end.elevation_m ?? 0) - (stretch.start.elevation_m ?? 0);

export const stretchAvgGradePct = (stretch: StoredStretch): number =>
  stretch.length_m > 0 ? (stretchElevationDelta(stretch) / stretch.length_m) * 100 : 0;

export const stretchKindFromGrade = (
  avgGradePct: number,
  thresholds: StretchThresholds,
): StretchKind => {
  if (avgGradePct >= thresholds.climb_grade_pct) return "climb";
  if (avgGradePct <= thresholds.descent_grade_pct) return "descent";
  return "flat";
};

export const enrichStretch = (
  stretch: StoredStretch,
  thresholds: StretchThresholds,
): Stretch => {
  const elevation_delta_m = stretchElevationDelta(stretch);
  const avg_grade_pct = stretchAvgGradePct(stretch);
  return {
    ...stretch,
    elevation_delta_m,
    avg_grade_pct,
    kind: stretchKindFromGrade(avg_grade_pct, thresholds),
  };
};

export interface StretchResult {
  stretches: Stretch[];
  segment_length_m: number;
  thresholds: StretchThresholds;
  reason?: string;
}

type Run = {
  kind: StretchKind;
  startDist: number;
  endDist: number;
};

type ResampledPoint = {
  lat: number;
  lon: number;
  elevation_m: number;
  distance_m: number;
};

type RunPipelineContext = {
  samples: ResampledPoint[];
  smoothed: number[];
  thresholds: StretchThresholds;
  segmentLengthM: number;
};

function interpolateAtDistance(
  points: StretchPoint[],
  dists: number[],
  targetDist: number,
): ResampledPoint | null {
  if (!points.length) return null;
  if (targetDist <= 0) {
    const elev = points[0].elevation_m;
    return elev == null
      ? null
      : { lat: points[0].lat, lon: points[0].lon, elevation_m: elev, distance_m: 0 };
  }

  const total = dists[dists.length - 1] ?? 0;
  if (targetDist >= total) {
    const last = points[points.length - 1];
    const elev = last.elevation_m;
    return elev == null ? null : { ...last, elevation_m: elev, distance_m: total };
  }

  let hi = 1;
  while (hi < dists.length && dists[hi] < targetDist) hi++;
  const lo = hi - 1;
  const span = dists[hi] - dists[lo];
  const t = span > 0 ? (targetDist - dists[lo]) / span : 0;

  const elevLo = points[lo].elevation_m;
  const elevHi = points[hi].elevation_m;
  if (elevLo == null || elevHi == null) return null;

  return {
    lat: points[lo].lat + t * (points[hi].lat - points[lo].lat),
    lon: points[lo].lon + t * (points[hi].lon - points[lo].lon),
    elevation_m: elevLo + t * (elevHi - elevLo),
    distance_m: targetDist,
  };
}

function resamplePath(points: StretchPoint[], spacingM: number): ResampledPoint[] {
  if (points.length < 2 || spacingM <= 0) return [];
  const dists = cumulativeDistancesM(points);
  const total = dists[dists.length - 1] ?? 0;
  if (total <= 0) return [];

  const samples: ResampledPoint[] = [];
  for (let d = 0; d <= total; d += spacingM) {
    const sample = interpolateAtDistance(points, dists, d);
    if (sample) samples.push(sample);
  }

  const end = interpolateAtDistance(points, dists, total);
  if (end && (samples.length === 0 || samples[samples.length - 1].distance_m < total - 0.5)) {
    samples.push(end);
  }
  return samples;
}

/** O(n) sliding-window elevation smooth along ordered distance samples. */
function smoothElevations(samples: ResampledPoint[], windowM: number): number[] {
  if (!samples.length) return [];
  const halfWindow = Math.max(windowM / 2, 1);
  const result = new Array<number>(samples.length);
  let left = 0;
  let right = 0;
  let sum = 0;
  let count = 0;

  for (let i = 0; i < samples.length; i++) {
    const center = samples[i].distance_m;
    while (right < samples.length && samples[right].distance_m <= center + halfWindow) {
      sum += samples[right].elevation_m;
      count += 1;
      right += 1;
    }
    while (left < right && samples[left].distance_m < center - halfWindow) {
      sum -= samples[left].elevation_m;
      count -= 1;
      left += 1;
    }
    result[i] = count > 0 ? sum / count : samples[i].elevation_m;
  }
  return result;
}

function gradeBetween(
  samples: ResampledPoint[],
  smoothed: number[],
  fromIdx: number,
  toIdx: number,
): number {
  const deltaDist = samples[toIdx].distance_m - samples[fromIdx].distance_m;
  if (deltaDist <= 0) return 0;
  const deltaElev = smoothed[toIdx] - smoothed[fromIdx];
  return (deltaElev / deltaDist) * 100;
}

function gradeAtIndex(samples: ResampledPoint[], smoothed: number[], index: number, windowM: number): number {
  if (index <= 0) {
    if (samples.length < 2) return 0;
    return gradeBetween(samples, smoothed, 0, 1);
  }
  const targetDist = samples[index].distance_m - windowM;
  let startIdx = 0;
  for (let i = index; i >= 0; i--) {
    if (samples[i].distance_m <= targetDist) {
      startIdx = i;
      break;
    }
  }
  return gradeBetween(samples, smoothed, startIdx, index);
}



function classifyWithHysteresis(
  grades: number[],
  thresholds: StretchThresholds,
): StretchKind[] {
  const kinds: StretchKind[] = [];
  let current: StretchKind = "flat";

  for (const grade of grades) {
    if (current === "climb") {
      if (grade <= thresholds.descent_grade_pct + thresholds.grade_hysteresis_pct) {
        current = "descent";
      } else if (grade < thresholds.climb_grade_pct - thresholds.grade_hysteresis_pct) {
        current = grade <= thresholds.descent_grade_pct ? "descent" : "flat";
      }
    } else if (current === "descent") {
      if (grade >= thresholds.climb_grade_pct - thresholds.grade_hysteresis_pct) {
        current = "climb";
      } else if (grade > thresholds.descent_grade_pct + thresholds.grade_hysteresis_pct) {
        current = grade >= thresholds.climb_grade_pct ? "climb" : "flat";
      }
    } else {
      if (grade >= thresholds.climb_grade_pct) current = "climb";
      else if (grade <= thresholds.descent_grade_pct) current = "descent";
      else current = "flat";
    }
    kinds.push(current);
  }

  return kinds;
}

function kindsToRuns(samples: ResampledPoint[], kinds: StretchKind[]): Run[] {
  if (!samples.length || !kinds.length) return [];
  const runs: Run[] = [];
  let start = 0;
  for (let i = 1; i <= kinds.length; i++) {
    if (i === kinds.length || kinds[i] !== kinds[start]) {
      runs.push({
        kind: kinds[start],
        startDist: samples[start].distance_m,
        endDist: samples[i - 1].distance_m,
      });
      start = i;
    }
  }
  return runs;
}

function minStretchLength(segmentLengthM: number, thresholds: StretchThresholds): number {
  return Math.min(segmentLengthM * thresholds.min_stretch_pct, thresholds.min_stretch_m);
}

function maxStretchLength(segmentLengthM: number, thresholds: StretchThresholds): number {
  return Math.min(segmentLengthM * thresholds.max_stretch_pct, thresholds.max_stretch_m);
}

function runLength(run: Run): number {
  return Math.max(0, run.endDist - run.startDist);
}

const mergeRuns = (a: Run, b: Run, ctx: RunPipelineContext): Run => {
  const merged = {
    kind: a.kind,
    startDist: a.startDist,
    endDist: b.endDist,
  };
  return reclassifyRun(merged, ctx.samples, ctx.smoothed, ctx.thresholds);
};

function dropZeroLengthRuns(runs: Run[]): Run[] {
  return runs.filter((run) => run.endDist - run.startDist > 0.5);
}

function reclassifyRun(
  run: Run,
  samples: ResampledPoint[],
  smoothed: number[],
  thresholds: StretchThresholds,
): Run {
  const length = run.endDist - run.startDist;
  if (length <= 0) return run;
  const start = boundaryAtDistance(samples, smoothed, run.startDist);
  const end = boundaryAtDistance(samples, smoothed, run.endDist);
  const avgGrade = ((end.elevation_m - start.elevation_m) / length) * 100;
  return { ...run, kind: stretchKindFromGrade(avgGrade, thresholds) };
}

function reclassifyRuns(
  runs: Run[],
  samples: ResampledPoint[],
  smoothed: number[],
  thresholds: StretchThresholds,
): Run[] {
  return runs.map((run) => reclassifyRun(run, samples, smoothed, thresholds));
}

const enforceMinLength = (runs: Run[], ctx: RunPipelineContext): Run[] => {
  const minLen = minStretchLength(ctx.segmentLengthM, ctx.thresholds);
  if (minLen <= 0 || runs.length <= 1) return runs;

  let result = runs.slice();
  let changed = true;
  while (changed && result.length > 1) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      if (runLength(result[i]) >= minLen) continue;

      if (i === 0) {
        result[1] = mergeRuns(result[0], result[1], ctx);
        result.splice(0, 1);
        changed = true;
        break;
      }
      if (i === result.length - 1) {
        result[i - 1] = mergeRuns(result[i - 1], result[i], ctx);
        result.splice(i, 1);
        changed = true;
        break;
      }

      const prev = result[i - 1];
      const next = result[i + 1];
      const current = result[i];
      const mergePrev = prev.kind === current.kind;
      const mergeNext = next.kind === current.kind;

      if (mergePrev && mergeNext) {
        if (runLength(prev) >= runLength(next)) {
          result[i - 1] = mergeRuns(prev, current, ctx);
          result.splice(i, 1);
        } else {
          result[i + 1] = mergeRuns(current, next, ctx);
          result.splice(i, 1);
        }
      } else if (mergePrev) {
        result[i - 1] = mergeRuns(prev, current, ctx);
        result.splice(i, 1);
      } else if (mergeNext) {
        result[i + 1] = mergeRuns(current, next, ctx);
        result.splice(i, 1);
      } else if (runLength(prev) >= runLength(next)) {
        result[i - 1] = mergeRuns(prev, current, ctx);
        result.splice(i, 1);
      } else {
        result[i + 1] = mergeRuns(current, next, ctx);
        result.splice(i, 1);
      }
      changed = true;
      break;
    }
  }
  return result;
};

function splitLongRuns(runs: Run[], segmentLengthM: number, thresholds: StretchThresholds): Run[] {
  const maxLen = maxStretchLength(segmentLengthM, thresholds);
  if (maxLen <= 0) return runs;

  const result: Run[] = [];
  for (const run of runs) {
    const length = runLength(run);
    if (length <= maxLen) {
      result.push(run);
      continue;
    }
    const parts = Math.ceil(length / maxLen);
    const partLen = length / parts;
    for (let i = 0; i < parts; i++) {
      result.push({
        kind: run.kind,
        startDist: run.startDist + i * partLen,
        endDist: i === parts - 1 ? run.endDist : run.startDist + (i + 1) * partLen,
      });
    }
  }
  return result;
}

function boundaryAtDistance(
  samples: ResampledPoint[],
  smoothed: number[],
  dist: number,
): { lat: number; lon: number; elevation_m: number } {
  if (!samples.length) {
    return { lat: 0, lon: 0, elevation_m: 0 };
  }
  if (dist <= samples[0].distance_m) {
    return {
      lat: samples[0].lat,
      lon: samples[0].lon,
      elevation_m: smoothed[0],
    };
  }
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].distance_m >= dist) {
      const prev = samples[i - 1];
      const span = samples[i].distance_m - prev.distance_m;
      const t = span > 0 ? (dist - prev.distance_m) / span : 0;
      return {
        lat: prev.lat + t * (samples[i].lat - prev.lat),
        lon: prev.lon + t * (samples[i].lon - prev.lon),
        elevation_m: smoothed[i - 1] + t * (smoothed[i] - smoothed[i - 1]),
      };
    }
  }
  const last = samples[samples.length - 1];
  return {
    lat: last.lat,
    lon: last.lon,
    elevation_m: smoothed[smoothed.length - 1],
  };
}

const finalizeRuns = (runs: Run[], ctx: RunPipelineContext): Stretch[] => {
  return runs.map((run, idx) => {
    const length = run.endDist - run.startDist;
    const start = boundaryAtDistance(ctx.samples, ctx.smoothed, run.startDist);
    const end = boundaryAtDistance(ctx.samples, ctx.smoothed, run.endDist);

    return enrichStretch(
      {
        index: idx + 1,
        start: {
          lat: start.lat,
          lon: start.lon,
          elevation_m: start.elevation_m,
        },
        end: {
          lat: end.lat,
          lon: end.lon,
          elevation_m: end.elevation_m,
        },
        length_m: length,
      },
      ctx.thresholds,
    );
  });
};

export function segmentizeStretches(
  points: StretchPoint[],
  thresholds: StretchThresholds = DEFAULT_STRETCH_THRESHOLDS,
): StretchResult {
  const mergedThresholds = { ...DEFAULT_STRETCH_THRESHOLDS, ...thresholds };

  if (points.length < 2) {
    return {
      stretches: [],
      segment_length_m: 0,
      thresholds: mergedThresholds,
      reason: "Segment needs at least two points",
    };
  }

  const dists = cumulativeDistancesM(points);
  const segmentLengthM = dists[dists.length - 1] ?? 0;
  if (segmentLengthM <= 0) {
    return {
      stretches: [],
      segment_length_m: 0,
      thresholds: mergedThresholds,
      reason: "Segment has no length",
    };
  }

  const elevationCount = points.filter((p) => p.elevation_m != null).length;
  if (elevationCount < 2) {
    return {
      stretches: [],
      segment_length_m: segmentLengthM,
      thresholds: mergedThresholds,
      reason: "Not enough elevation data to split into stretches",
    };
  }

  const samples = resamplePath(points, mergedThresholds.resample_spacing_m);
  if (samples.length < 2) {
    return {
      stretches: [],
      segment_length_m: segmentLengthM,
      thresholds: mergedThresholds,
      reason: "Could not resample segment path",
    };
  }

  const smoothed = smoothElevations(samples, mergedThresholds.grade_window_m);
  const grades = samples.map((_, i) =>
    gradeAtIndex(samples, smoothed, i, mergedThresholds.grade_window_m),
  );
  const kinds = classifyWithHysteresis(grades, mergedThresholds);

  const pipelineCtx: RunPipelineContext = {
    samples,
    smoothed,
    thresholds: mergedThresholds,
    segmentLengthM,
  };

  let runs = dropZeroLengthRuns(kindsToRuns(samples, kinds));
  runs = enforceMinLength(runs, pipelineCtx);
  runs = splitLongRuns(runs, segmentLengthM, mergedThresholds);
  runs = reclassifyRuns(runs, samples, smoothed, mergedThresholds);

  if (!runs.length) {
    return {
      stretches: [],
      segment_length_m: segmentLengthM,
      thresholds: mergedThresholds,
      reason: "No stretches produced",
    };
  }

  const last = runs[runs.length - 1];
  if (last.endDist < segmentLengthM - 0.5) {
    runs[runs.length - 1] = { ...last, endDist: segmentLengthM };
  }
  runs[0] = { ...runs[0], startDist: 0 };

  return {
    stretches: finalizeRuns(runs, pipelineCtx),
    segment_length_m: segmentLengthM,
    thresholds: mergedThresholds,
  };
}

