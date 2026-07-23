import {
  formatActivityDate,
  formatActivityTime,
  resolveActivityDateTime,
} from "../../../../activityDisplay";
import { elapsedSecAtIndex, indexAtElapsedSec, indexAtRelativePosition } from "../../../../routeExplorerUtils";
import type { SegmentPass, TrackPoint } from "../../../../types";
import {
  CHART_BOTTOM,
  CHART_TOP,
  computeElevationGridLines,
  elevToChartY,
  elevToTopPercent,
  hrToChartY,
  hrToTopPercent,
  type ElevScale,
} from "../../../activities/ActivityTrackChart/activityTrackChartUtils";
import type { PositionPassRow } from "../positionCompareTypes";
import { passChartLineDash } from "./passChartLineStyles";

export type PassCompareTrackPass = {
  label: string;
  color: string;
  seriesIndex: number;
  dasharray?: string;
  points: TrackPoint[];
  durationSec?: number | null;
  maxHr?: number | null;
};

export type PassCompareChartMode = "position" | "time";

export type PassCompareHrLine = {
  label: string;
  seriesIndex: number;
  color: string;
  dasharray?: string;
  path: string;
  endX: number;
  endY: number;
};

export type PassCompareTrackChartData = {
  hrMin: number;
  hrMax: number;
  lines: PassCompareHrLine[];
  elevationArea: string | null;
  elevationLine: string | null;
  elevMin: number;
  elevMax: number;
  hasElevation: boolean;
  zoneMaxHr: number | null;
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

const xFractionAtIndex = (
  mode: PassCompareChartMode,
  points: TrackPoint[],
  index: number,
  durationSec: number | null | undefined,
  maxTimeSec: number,
): number => {
  if (mode === "position") {
    return points.length <= 1 ? 0 : index / (points.length - 1);
  }
  const elapsed = elapsedSecAtIndex(points, index, durationSec);
  if (elapsed == null || maxTimeSec <= 0) {
    return points.length <= 1 ? 0 : index / (points.length - 1);
  }
  return Math.min(1, elapsed / maxTimeSec);
};

const hrYAt = (hr: number, hrMin: number, hrMax: number): number => {
  const span = Math.max(hrMax - hrMin, 1);
  return CHART_BOTTOM - ((hr - hrMin) / span) * (CHART_BOTTOM - CHART_TOP);
};

export const formatPassChartLabel = (pass: SegmentPass): string => {
  const namePart =
    pass.pass_number > 1 ? `${pass.activity_name} · pass ${pass.pass_number}` : pass.activity_name;

  const resolved = resolveActivityDateTime({
    started_at: pass.started_at,
    created_at: pass.created_at,
    name: pass.activity_name,
    source_filename: pass.source_filename,
  });
  if (!resolved) return namePart;

  const time = formatActivityTime(resolved.at, resolved.hasTime);
  const datePart =
    time !== "—"
      ? `${formatActivityDate(resolved.at)} · ${time}`
      : formatActivityDate(resolved.at);

  return `${datePart} — ${namePart}`;
};

export const passChartItemsFromRows = (
  rows: PositionPassRow[],
  matchedPasses: ReadonlyArray<{ id: number }> = [],
): PassCompareTrackPass[] =>
  rows.map((row, index) => {
    const passIndex = matchedPasses.findIndex((pass) => pass.id === row.slice.pass.id);
    const paletteIndex = passIndex >= 0 ? passIndex : index;
    return {
      label: formatPassChartLabel(row.slice.pass),
      color: row.color,
      seriesIndex: index,
      dasharray: passChartLineDash(paletteIndex),
      points: row.slice.points,
      durationSec: row.slice.durationSec,
      maxHr: row.slice.pass.max_hr,
    };
  });

export const passesHaveHeartRate = (passes: PassCompareTrackPass[]): boolean =>
  passes.some((pass) => pass.points.some((point) => point.heart_rate != null));

export const buildPassCompareTrackChartData = (
  passes: PassCompareTrackPass[],
  options: {
    mode: PassCompareChartMode;
    elevationPoints?: TrackPoint[];
    maxTimeSec?: number;
    maxSamples?: number;
    zoneMaxHr?: number | null;
  },
): PassCompareTrackChartData | null => {
  const { mode, elevationPoints = [], maxTimeSec = 0, maxSamples = 280, zoneMaxHr = null } = options;

  const passesWithHr = passes.filter((pass) =>
    pass.points.some((point) => point.heart_rate != null),
  );
  if (!passesWithHr.length) return null;

  const allHrs: number[] = [];
  for (const pass of passesWithHr) {
    for (const point of pass.points) {
      if (point.heart_rate != null) allHrs.push(point.heart_rate);
    }
  }
  if (!allHrs.length) return null;

  const hrMin = Math.min(...allHrs);
  const hrMax = Math.max(...allHrs);

  const lines: PassCompareHrLine[] = [];
  for (const pass of passesWithHr) {
    const indices = downsampleIndices(pass.points.length, maxSamples);
    const hrPoints = indices
      .map((index) => {
        const hr = pass.points[index].heart_rate;
        if (hr == null) return null;
        const fraction = xFractionAtIndex(mode, pass.points, index, pass.durationSec, maxTimeSec);
        return { x: fraction * 100, y: hrYAt(hr, hrMin, hrMax) };
      })
      .filter((point): point is { x: number; y: number } => point != null);

    if (!hrPoints.length) continue;
    const path = hrPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const lastPoint = hrPoints[hrPoints.length - 1];
    lines.push({
      label: pass.label,
      seriesIndex: pass.seriesIndex,
      color: pass.color,
      dasharray: pass.dasharray,
      path,
      endX: lastPoint.x,
      endY: lastPoint.y,
    });
  }

  if (!lines.length) return null;

  let elevationArea: string | null = null;
  let elevationLine: string | null = null;
  let elevMin = hrMin;
  let elevMax = hrMax;
  let hasElevation = false;

  const elevs = elevationPoints
    .map((point) => point.elevation_m)
    .filter((value): value is number => value != null);
  if (elevs.length > 0) {
    hasElevation = true;
    elevMin = Math.min(...elevs);
    elevMax = Math.max(...elevs);
    const elevSpan = Math.max(elevMax - elevMin, 1);
    const elevYAt = (elev: number) =>
      CHART_BOTTOM - ((elev - elevMin) / elevSpan) * (CHART_BOTTOM - CHART_TOP);

    const elevIndices = downsampleIndices(elevationPoints.length, maxSamples);
    const elevPoints = elevIndices
      .map((index) => {
        const elev = elevationPoints[index].elevation_m;
        if (elev == null) return null;
        // Align elevation X with HR series: position fraction or elapsed/maxTime in time mode.
        const fraction = xFractionAtIndex(
          mode,
          elevationPoints,
          index,
          null,
          maxTimeSec,
        );
        return { x: fraction * 100, y: elevYAt(elev) };
      })
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

  return {
    hrMin,
    hrMax,
    lines,
    elevationArea,
    elevationLine,
    elevMin,
    elevMax,
    hasElevation,
    zoneMaxHr,
  };
};

export type PassCompareHoverSample = {
  label: string;
  color: string;
  hr: number | null;
};

export const samplePassesAtFraction = (
  passes: PassCompareTrackPass[],
  mode: PassCompareChartMode,
  fraction: number,
  maxTimeSec: number,
): PassCompareHoverSample[] => {
  const clamped = Math.max(0, Math.min(1, fraction));
  return passes.map((pass) => {
    const index =
      mode === "position"
        ? indexAtRelativePosition(pass.points, clamped)
        : indexAtElapsedSec(pass.points, clamped * maxTimeSec, pass.durationSec);
    return {
      label: pass.label,
      color: pass.color,
      hr: pass.points[index]?.heart_rate ?? null,
    };
  });
};

export const passCompareHrScale = (data: PassCompareTrackChartData) => ({
  hrMin: data.hrMin,
  hrMax: data.hrMax,
});

export const passCompareElevScale = (data: PassCompareTrackChartData): ElevScale => ({
  elevMin: data.elevMin,
  elevMax: data.elevMax,
});

export const passCompareElevationGridLines = (data: PassCompareTrackChartData): number[] => {
  if (!data.hasElevation) return [];
  return computeElevationGridLines(data.elevMin, data.elevMax);
};

export const passCompareElevToChartY = (elev: number, data: PassCompareTrackChartData): number =>
  elevToChartY(elev, passCompareElevScale(data));

export const passCompareElevToTopPercent = (elev: number, data: PassCompareTrackChartData): number =>
  elevToTopPercent(elev, passCompareElevScale(data));

export const passCompareHrToChartY = (hr: number, data: PassCompareTrackChartData): number =>
  hrToChartY(hr, passCompareHrScale(data));

export const passCompareHrToTopPercent = (hr: number, data: PassCompareTrackChartData): number =>
  hrToTopPercent(hr, passCompareHrScale(data));