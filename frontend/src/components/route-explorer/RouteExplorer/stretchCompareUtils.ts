import {
  elapsedSecAtIndex,
  indexAtElapsedSec,
  type ExplorerPassSlice,
} from "../../../routeExplorerUtils";
import { stretchIndicesOnPass } from "../../../stretchUtils";
import type { Stretch, TrackPoint } from "../../../types";

/** Duration of a stretch on one pass (seconds). */
export const stretchDurationOnPass = (
  points: TrackPoint[],
  stretch: Stretch,
  durationSec?: number | null,
): number => {
  if (!points.length) return 0;
  const { startIdx, endIdx } = stretchIndicesOnPass(points, stretch);
  if (endIdx <= startIdx) return 0;

  const startElapsed = elapsedSecAtIndex(points, startIdx, durationSec);
  const endElapsed = elapsedSecAtIndex(points, endIdx, durationSec);
  if (startElapsed != null && endElapsed != null) {
    return Math.max(0, endElapsed - startElapsed);
  }

  const span = endIdx - startIdx;
  const total = points.length - 1;
  if (total <= 0) return 0;
  const fallbackDuration = durationSec != null && durationSec > 0 ? durationSec : total;
  return (span / total) * fallbackDuration;
};

/** Max stretch duration among selected passes (slider max for that stretch). */
export const maxStretchDurationSec = (
  passSlices: ReadonlyArray<ExplorerPassSlice>,
  stretch: Stretch,
): number => {
  if (!passSlices.length) return 0;
  return Math.max(
    0,
    ...passSlices.map((slice) =>
      stretchDurationOnPass(slice.points, stretch, slice.durationSec),
    ),
  );
};

export const stretchDurationsSec = (
  passSlices: ReadonlyArray<ExplorerPassSlice>,
  stretches: ReadonlyArray<Stretch>,
): number[] => stretches.map((stretch) => maxStretchDurationSec(passSlices, stretch));

export const virtualMaxSec = (durations: ReadonlyArray<number>): number =>
  durations.reduce((sum, d) => sum + Math.max(0, d), 0);

export type StretchVirtualPosition = {
  stretchIndex: number;
  localElapsedSec: number;
};

/**
 * Map continuous virtual scrub V → current stretch + local elapsed.
 * Half-open intervals: stretch i owns [sum(prev), sum(prev)+d_i); last stretch includes virtualMax.
 * So V at the shared boundary is the **start of the next** stretch (Next button / reverse-friendly).
 */
export const virtualToStretchPosition = (
  virtualSec: number,
  durations: ReadonlyArray<number>,
): StretchVirtualPosition => {
  if (!durations.length) return { stretchIndex: 0, localElapsedSec: 0 };

  const max = virtualMaxSec(durations);
  const clamped = Math.max(0, Math.min(virtualSec, max));
  if (max <= 0) return { stretchIndex: 0, localElapsedSec: 0 };

  if (clamped >= max) {
    const last = durations.length - 1;
    return { stretchIndex: last, localElapsedSec: Math.max(0, durations[last]) };
  }

  let acc = 0;
  for (let i = 0; i < durations.length; i++) {
    const d = Math.max(0, durations[i]);
    const nextAcc = acc + d;
    const isLast = i === durations.length - 1;
    if (clamped < nextAcc || isLast) {
      return {
        stretchIndex: i,
        localElapsedSec: Math.min(Math.max(0, clamped - acc), d),
      };
    }
    acc = nextAcc;
  }

  const last = durations.length - 1;
  return { stretchIndex: last, localElapsedSec: Math.max(0, durations[last]) };
};

/** Map stretch index + local elapsed → virtual V. */
export const stretchPositionToVirtual = (
  stretchIndex: number,
  localElapsedSec: number,
  durations: ReadonlyArray<number>,
): number => {
  if (!durations.length) return 0;
  const i = Math.max(0, Math.min(stretchIndex, durations.length - 1));
  let sum = 0;
  for (let j = 0; j < i; j++) sum += Math.max(0, durations[j]);
  const d = Math.max(0, durations[i]);
  return sum + Math.max(0, Math.min(localElapsedSec, d));
};

/** Virtual V at the start of stretch `stretchIndex`. */
export const virtualAtStretchStart = (
  stretchIndex: number,
  durations: ReadonlyArray<number>,
): number => stretchPositionToVirtual(stretchIndex, 0, durations);

/**
 * Point index on a pass at stretch-local elapsed t (from stretch start).
 * Clamped to the stretch index span.
 */
export const indexAtStretchElapsedSec = (
  points: TrackPoint[],
  stretch: Stretch,
  localElapsedSec: number,
  durationSec?: number | null,
): number => {
  if (!points.length) return 0;
  const { startIdx, endIdx } = stretchIndicesOnPass(points, stretch);
  if (endIdx <= startIdx) return startIdx;

  const startElapsed = elapsedSecAtIndex(points, startIdx, durationSec);
  if (startElapsed != null) {
    const target = startElapsed + Math.max(0, localElapsedSec);
    const idx = indexAtElapsedSec(points, target, durationSec);
    return Math.max(startIdx, Math.min(endIdx, idx));
  }

  const span = endIdx - startIdx;
  const maxLocal = stretchDurationOnPass(points, stretch, durationSec);
  const fraction = maxLocal > 0 ? Math.min(1, Math.max(0, localElapsedSec) / maxLocal) : 0;
  return startIdx + Math.round(fraction * span);
};

/** Slice track points for the current stretch (for HR/elev chart window). */
export const slicePointsForStretch = (
  points: TrackPoint[],
  stretch: Stretch,
): TrackPoint[] => {
  if (!points.length) return [];
  const { startIdx, endIdx } = stretchIndicesOnPass(points, stretch);
  const end = Math.max(startIdx, endIdx);
  return points.slice(startIdx, end + 1);
};
