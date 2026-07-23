import type { HrScale } from "../../../lib/hrZones";
import type { TrackPoint } from "../../../types";

export type ActivityTrackSample = {
  hr: number | null;
  elev: number | null;
};

export type ActivityTrackSeries = {
  samples: ActivityTrackSample[];
  hrMin: number;
  hrMax: number;
  elevMin: number;
  elevMax: number;
  hasElevation: boolean;
};

const downsampleIndices = (length: number, maxSamples: number): number[] => {
  if (length <= maxSamples) return Array.from({ length }, (_, index) => index);
  const indices: number[] = [];
  const step = (length - 1) / (maxSamples - 1);
  for (let i = 0; i < maxSamples; i++) {
    indices.push(Math.round(i * step));
  }
  return indices;
};

const forwardFillElevation = (samples: ActivityTrackSample[]): ActivityTrackSample[] => {
  let lastElev: number | null = null;
  return samples.map((sample) => {
    if (sample.elev != null) {
      lastElev = sample.elev;
      return sample;
    }
    return lastElev == null ? sample : { ...sample, elev: lastElev };
  });
};

export const buildActivityTrackSeries = (
  points: TrackPoint[],
  maxSamples = 280,
): ActivityTrackSeries | null => {
  if (points.length < 2) return null;
  if (!points.some((point) => point.heart_rate != null)) return null;

  const indices = downsampleIndices(points.length, maxSamples);
  const samples = forwardFillElevation(
    indices.map((index) => ({
      hr: points[index].heart_rate ?? null,
      elev: points[index].elevation_m ?? null,
    })),
  );

  const hrs = samples.map((sample) => sample.hr).filter((value): value is number => value != null);
  if (!hrs.length) return null;

  const elevs = samples
    .map((sample) => sample.elev)
    .filter((value): value is number => value != null);

  const hrMin = Math.min(...hrs);
  const hrMax = Math.max(...hrs);
  const elevMin = elevs.length ? Math.min(...elevs) : hrMin;
  const elevMax = elevs.length ? Math.max(...elevs) : hrMax;

  return {
    samples,
    hrMin,
    hrMax,
    elevMin,
    elevMax,
    hasElevation: elevs.length > 0,
  };
};

export const CHART_TOP = 2;
export const CHART_BOTTOM = 38;

export const CHART_VIEW_HEIGHT = 40;

export type { HrScale } from "../../../lib/hrZones";

export const hrToChartY = (hr: number, scale: HrScale): number => {
  const span = Math.max(scale.hrMax - scale.hrMin, 1);
  return CHART_BOTTOM - ((hr - scale.hrMin) / span) * (CHART_BOTTOM - CHART_TOP);
};

export const hrToTopPercent = (hr: number, scale: HrScale): number =>
  (hrToChartY(hr, scale) / CHART_VIEW_HEIGHT) * 100;

const clampFraction = (value: number) => Math.max(0, Math.min(1, value));

export const sampleAtFraction = (
  series: ActivityTrackSeries,
  fraction: number,
): ActivityTrackSample => {
  const count = series.samples.length;
  if (count === 0) return { hr: null, elev: null };
  const index = Math.round(clampFraction(fraction) * (count - 1));
  return series.samples[index];
};

export type ElevScale = {
  elevMin: number;
  elevMax: number;
};

export const elevToChartY = (elev: number, scale: ElevScale): number => {
  const span = Math.max(scale.elevMax - scale.elevMin, 1);
  return CHART_BOTTOM - ((elev - scale.elevMin) / span) * (CHART_BOTTOM - CHART_TOP);
};

export const elevToTopPercent = (elev: number, scale: ElevScale): number =>
  (elevToChartY(elev, scale) / CHART_VIEW_HEIGHT) * 100;

const pickElevationGridStep = (span: number): number => {
  if (span <= 15) return 5;
  if (span <= 40) return 10;
  if (span <= 100) return 20;
  if (span <= 250) return 50;
  return 100;
};

export const computeElevationGridLines = (elevMin: number, elevMax: number): number[] => {
  const span = elevMax - elevMin;
  if (span < 8) return [];

  const step = pickElevationGridStep(span);
  const first = Math.ceil(elevMin / step) * step;
  const lines: number[] = [];

  for (let elev = first; elev < elevMax; elev += step) {
    if (elev <= elevMin + span * 0.08 || elev >= elevMax - span * 0.08) continue;
    lines.push(elev);
  }

  return lines;
};

export const seriesToSvgPaths = (series: ActivityTrackSeries) => {
  const { samples, hrMin, hrMax, elevMin, elevMax, hasElevation } = series;
  const count = samples.length;
  const hrSpan = Math.max(hrMax - hrMin, 1);
  const elevSpan = Math.max(elevMax - elevMin, 1);

  const xAt = (index: number) => (count <= 1 ? 0 : (index / (count - 1)) * 100);
  const hrYAt = (hr: number) =>
    CHART_BOTTOM - ((hr - hrMin) / hrSpan) * (CHART_BOTTOM - CHART_TOP);
  const elevYAt = (elev: number) =>
    CHART_BOTTOM - ((elev - elevMin) / elevSpan) * (CHART_BOTTOM - CHART_TOP);

  const hrPoints = samples
    .map((sample, index) =>
      sample.hr == null ? null : { x: xAt(index), y: hrYAt(sample.hr) },
    )
    .filter((point): point is { x: number; y: number } => point != null);

  const hrLine =
    hrPoints.length > 0
      ? hrPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
      : null;

  let elevationArea: string | null = null;
  let elevationLine: string | null = null;

  if (hasElevation) {
    const elevPoints = samples
      .map((sample, index) =>
        sample.elev == null ? null : { x: xAt(index), y: elevYAt(sample.elev) },
      )
      .filter((point): point is { x: number; y: number } => point != null);

    if (elevPoints.length > 1) {
      const line = elevPoints
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");
      const first = elevPoints[0];
      const last = elevPoints[elevPoints.length - 1];
      elevationArea = `${line} L ${last.x} ${CHART_BOTTOM} L ${first.x} ${CHART_BOTTOM} Z`;
      elevationLine = line;
    }
  }

  return { hrLine, elevationArea, elevationLine };
};