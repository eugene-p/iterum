import { elapsedSecAtIndex } from "../routeExplorerUtils";
import type { TrackPoint } from "../types";

export const estimateMaxHrFromYearOfBirth = (
  yearOfBirth: number | null | undefined,
  referenceYear = new Date().getFullYear(),
): number | null => {
  if (yearOfBirth == null) return null;
  const age = referenceYear - yearOfBirth;
  if (age < 1 || age > 120) return null;
  return 220 - age;
};

export const profileMaxHr = (profile: { year_of_birth: number | null } | null | undefined): number | null =>
  estimateMaxHrFromYearOfBirth(profile?.year_of_birth);

export const HR_ZONES = [
  { id: "z1", label: "Z1", minPct: 0, maxPct: 0.6, color: "#6b9bd1" },
  { id: "z2", label: "Z2", minPct: 0.6, maxPct: 0.7, color: "#4ade80" },
  { id: "z3", label: "Z3", minPct: 0.7, maxPct: 0.8, color: "#facc15" },
  { id: "z4", label: "Z4", minPct: 0.8, maxPct: 0.9, color: "#fb923c" },
  { id: "z5", label: "Z5", minPct: 0.9, maxPct: 1, color: "#f87171" },
] as const;

export type HrZoneId = (typeof HR_ZONES)[number]["id"];

export type HrScale = {
  hrMin: number;
  hrMax: number;
};

export type HrZoneBand = {
  id: HrZoneId;
  label: string;
  color: string;
  yTop: number;
  yBottom: number;
};

export type HrZoneTimeEntry = {
  id: HrZoneId;
  label: string;
  color: string;
  seconds: number;
};

export type HrZoneTimeSeries = {
  label?: string;
  color?: string;
  points: TrackPoint[];
  durationSec?: number | null;
};

export const hrToZoneIndex = (hr: number, maxHr: number): number => {
  const pct = hr / maxHr;
  if (pct < 0.6) return 0;
  if (pct < 0.7) return 1;
  if (pct < 0.8) return 2;
  if (pct < 0.9) return 3;
  return 4;
};

export const computeHrZoneBands = (
  maxHr: number,
  scale: HrScale,
  hrToY: (hr: number, scale: HrScale) => number,
): HrZoneBand[] => {
  const { hrMin, hrMax } = scale;
  const bands: HrZoneBand[] = [];

  for (const zone of HR_ZONES) {
    const hrLow = Math.round(maxHr * zone.minPct);
    const hrHigh = Math.round(maxHr * zone.maxPct);
    const visibleLow = Math.max(hrLow, hrMin);
    const visibleHigh = Math.min(hrHigh, hrMax);
    if (visibleHigh <= visibleLow) continue;

    bands.push({
      id: zone.id,
      label: zone.label,
      color: zone.color,
      yTop: hrToY(visibleHigh, scale),
      yBottom: hrToY(visibleLow, scale),
    });
  }

  return bands;
};

export const computeHrZoneTimes = (
  points: TrackPoint[],
  maxHr: number,
  durationSec?: number | null,
): HrZoneTimeEntry[] => {
  const seconds = HR_ZONES.map((zone) => ({
    id: zone.id,
    label: zone.label,
    color: zone.color,
    seconds: 0,
  }));

  if (points.length < 2) return seconds;

  for (let index = 0; index < points.length - 1; index++) {
    const hr = points[index].heart_rate;
    if (hr == null) continue;

    const startSec = elapsedSecAtIndex(points, index, durationSec);
    const endSec = elapsedSecAtIndex(points, index + 1, durationSec);
    if (startSec == null || endSec == null) continue;

    const delta = endSec - startSec;
    if (delta <= 0) continue;

    seconds[hrToZoneIndex(hr, maxHr)].seconds += delta;
  }

  return seconds;
};

export const computeHrZoneTimesForSeries = (
  series: HrZoneTimeSeries[],
  maxHr: number,
): Array<{ seriesLabel?: string; seriesColor?: string; zones: HrZoneTimeEntry[] }> =>
  series.map((entry) => ({
    seriesLabel: entry.label,
    seriesColor: entry.color,
    zones: computeHrZoneTimes(entry.points, maxHr, entry.durationSec),
  }));