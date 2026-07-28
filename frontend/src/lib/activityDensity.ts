import type { ActivitySummary } from "../types";
import { activityDayKey, localDayKeyFromDate } from "./activityListGrouping";

/** Visible window: two week-rows of 7 days each. */
export const ACTIVITY_DENSITY_WEEKS = 2;

/** Slide step when paging the density window (days). */
export const ACTIVITY_DENSITY_SLIDE_DAYS = 7;

export type DensityCell = {
  dayKey: string;
  count: number;
  date: Date;
};

export type BuildActivityDensityOptions = {
  /** Inclusive end of the window (local calendar day). Defaults to today. */
  endDate?: Date;
  weeks?: number;
  now?: Date;
};

export const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addLocalDays = (date: Date, days: number): Date => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
};

/** Inclusive end day for a sliding window: today shifted back by `offsetWeeks` weeks. */
export const densityWindowEnd = (offsetWeeks: number, now: Date = new Date()): Date => {
  const weeks = Math.max(0, offsetWeeks);
  return addLocalDays(startOfLocalDay(now), -(weeks * ACTIVITY_DENSITY_SLIDE_DAYS));
};

/** Earliest local day key among dated activities, or null. */
export const earliestActivityDayKey = (
  activities: readonly ActivitySummary[],
): string | null => {
  let earliest: string | null = null;
  for (const activity of activities) {
    const key = activityDayKey(activity);
    if (!key) continue;
    if (earliest === null || key < earliest) earliest = key;
  }
  return earliest;
};

/**
 * True when older activity exists before the visible 14-day window.
 * If the oldest activity is already in range, the earlier arrow should be off.
 */
export const canSlideDensityEarlier = (
  activities: readonly ActivitySummary[],
  offsetWeeks: number,
  now: Date = new Date(),
): boolean => {
  const earliest = earliestActivityDayKey(activities);
  if (!earliest) return false;

  const weeks = ACTIVITY_DENSITY_WEEKS;
  const end = densityWindowEnd(offsetWeeks, now);
  const start = addLocalDays(end, -(weeks * 7 - 1));
  const startKey = localDayKeyFromDate(start);
  return earliest < startKey;
};

export const buildActivityDensity = (
  activities: readonly ActivitySummary[],
  options: BuildActivityDensityOptions = {},
): DensityCell[] => {
  const now = options.now ?? new Date();
  const weeks = options.weeks ?? ACTIVITY_DENSITY_WEEKS;
  const dayCount = Math.max(1, weeks) * 7;
  const end = startOfLocalDay(options.endDate ?? now);
  const start = addLocalDays(end, -(dayCount - 1));

  const counts = new Map<string, number>();
  for (const activity of activities) {
    const key = activityDayKey(activity);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells: DensityCell[] = [];
  for (let i = 0; i < dayCount; i++) {
    const date = addLocalDays(start, i);
    const dayKey = localDayKeyFromDate(date);
    cells.push({
      dayKey,
      date,
      count: counts.get(dayKey) ?? 0,
    });
  }
  return cells;
};

/** Single compact range for the density chrome (not per-row). */
export const formatDensityWindowLabel = (
  cells: readonly DensityCell[],
  now: Date = new Date(),
): string => {
  const first = cells[0]?.date;
  const last = cells[cells.length - 1]?.date;
  if (!first || !last) return "";

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (first.getFullYear() !== now.getFullYear() || last.getFullYear() !== now.getFullYear()) {
    opts.year = "numeric";
  }
  if (localDayKeyFromDate(first) === localDayKeyFromDate(last)) {
    return first.toLocaleDateString(undefined, opts);
  }
  return `${first.toLocaleDateString(undefined, opts)} – ${last.toLocaleDateString(undefined, opts)}`;
};

/** Discrete heat levels 0–4 for density cells. */
export const densityLevel = (count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 => {
  if (count <= 0 || maxCount <= 0) return 0;
  if (count >= maxCount) return 4;
  const ratio = count / maxCount;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
};

/** Split a flat day list into week rows of 7 (older week first). */
export const densityWeekRows = (
  cells: readonly DensityCell[],
  daysPerWeek = 7,
): DensityCell[][] => {
  if (cells.length === 0) return [];
  const rows: DensityCell[][] = [];
  for (let i = 0; i < cells.length; i += daysPerWeek) {
    rows.push([...cells.slice(i, i + daysPerWeek)]);
  }
  return rows;
};
