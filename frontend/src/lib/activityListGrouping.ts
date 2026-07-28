import { resolveActivityDateTime } from "../activityDisplay";
import type { ActivitySummary } from "../types";
import type { ActivityListSort } from "./activityListSort";
import { sortActivities } from "./activityListSort";

export const UNKNOWN_ACTIVITY_DAY_KEY = "unknown";
export const UNKNOWN_ACTIVITY_WEEK_KEY = "unknown";

export type ActivityDayGroup = {
  dayKey: string;
  label: string;
  activities: ActivitySummary[];
};

export type ActivityWeekGroup = {
  weekKey: string;
  label: string;
  activities: ActivitySummary[];
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const localDayKeyFromDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Monday-start local week. */
export const startOfLocalWeek = (date: Date): Date => {
  const day = startOfLocalDay(date);
  const weekday = day.getDay(); // 0 = Sun
  const delta = weekday === 0 ? -6 : 1 - weekday;
  day.setDate(day.getDate() + delta);
  return day;
};

export const parseLocalDayKey = (dayKey: string): Date | null => {
  const match = dayKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const activityDayKey = (activity: ActivitySummary): string | null => {
  const resolved = resolveActivityDateTime({
    started_at: activity.started_at,
    created_at: activity.created_at,
    name: activity.name,
    source_filename: activity.source_filename,
  });
  if (!resolved) return null;
  return localDayKeyFromDate(resolved.at);
};

export const activityWeekKey = (activity: ActivitySummary): string | null => {
  const dayKey = activityDayKey(activity);
  if (!dayKey) return null;
  const day = parseLocalDayKey(dayKey);
  if (!day) return null;
  return localDayKeyFromDate(startOfLocalWeek(day));
};

export const formatActivityDayLabel = (
  dayKey: string,
  now: Date = new Date(),
): string => {
  if (dayKey === UNKNOWN_ACTIVITY_DAY_KEY) return "Unknown date";

  const at = parseLocalDayKey(dayKey);
  if (!at) return dayKey;

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  if (at.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return at.toLocaleDateString(undefined, options);
};

export const formatActivityWeekLabel = (
  weekKey: string,
  now: Date = new Date(),
): string => {
  if (weekKey === UNKNOWN_ACTIVITY_WEEK_KEY) return "Unknown week";

  const start = parseLocalDayKey(weekKey);
  if (!start) return weekKey;

  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const thisWeekStart = startOfLocalWeek(now);
  if (localDayKeyFromDate(start) === localDayKeyFromDate(thisWeekStart)) {
    return "This week";
  }

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start.getFullYear() !== now.getFullYear() || end.getFullYear() !== now.getFullYear()) {
    opts.year = "numeric";
  }
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
};

/**
 * Alternating day-band flags for a pre-sorted activity list.
 * Consecutive activities on the same local day share a stripe so multi-activity
 * days read as grouped without day headers.
 */
export const activityDayStripeFlags = (
  activities: readonly ActivitySummary[],
): boolean[] => {
  let stripe = false;
  let lastDay: string | null = null;
  return activities.map((activity) => {
    const day = activityDayKey(activity) ?? UNKNOWN_ACTIVITY_DAY_KEY;
    if (day !== lastDay) {
      if (lastDay !== null) stripe = !stripe;
      lastDay = day;
    }
    return stripe;
  });
};

export const groupActivitiesByDay = (
  activities: readonly ActivitySummary[],
  sort: Extract<ActivityListSort, "newest" | "oldest"> = "newest",
  now: Date = new Date(),
): ActivityDayGroup[] => {
  const ordered = sortActivities(activities, sort);
  const buckets = new Map<string, ActivitySummary[]>();

  for (const activity of ordered) {
    const key = activityDayKey(activity) ?? UNKNOWN_ACTIVITY_DAY_KEY;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(activity);
    else buckets.set(key, [activity]);
  }

  const knownKeys = [...buckets.keys()].filter((key) => key !== UNKNOWN_ACTIVITY_DAY_KEY);
  knownKeys.sort((a, b) => (sort === "oldest" ? a.localeCompare(b) : b.localeCompare(a)));

  const keys =
    buckets.has(UNKNOWN_ACTIVITY_DAY_KEY) ?
      [...knownKeys, UNKNOWN_ACTIVITY_DAY_KEY]
    : knownKeys;

  return keys.map((dayKey) => ({
    dayKey,
    label: formatActivityDayLabel(dayKey, now),
    activities: buckets.get(dayKey) ?? [],
  }));
};

/**
 * Group a sorted list into Monday-start weeks.
 * Within each week, activity order follows `sort`. Week order is newest-first
 * except for `oldest` sort.
 */
export const groupActivitiesByWeek = (
  activities: readonly ActivitySummary[],
  sort: ActivityListSort = "newest",
  now: Date = new Date(),
): ActivityWeekGroup[] => {
  const ordered = sortActivities(activities, sort);
  const buckets = new Map<string, ActivitySummary[]>();

  for (const activity of ordered) {
    const key = activityWeekKey(activity) ?? UNKNOWN_ACTIVITY_WEEK_KEY;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(activity);
    else buckets.set(key, [activity]);
  }

  const knownKeys = [...buckets.keys()].filter((key) => key !== UNKNOWN_ACTIVITY_WEEK_KEY);
  const newestFirst = sort !== "oldest";
  knownKeys.sort((a, b) => (newestFirst ? b.localeCompare(a) : a.localeCompare(b)));

  const keys =
    buckets.has(UNKNOWN_ACTIVITY_WEEK_KEY) ?
      [...knownKeys, UNKNOWN_ACTIVITY_WEEK_KEY]
    : knownKeys;

  return keys.map((weekKey) => ({
    weekKey,
    label: formatActivityWeekLabel(weekKey, now),
    activities: buckets.get(weekKey) ?? [],
  }));
};
