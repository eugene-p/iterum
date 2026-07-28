import { formatActivityDate } from "../../../activityDisplay";
import { formatRelativePast } from "../../../lib/formatRelativePast";
import { formatTags } from "../../../lib/formatTags";
import type { ActivityRouteCluster } from "../../../lib/activityRouteCluster";
import type { ActivitySummary } from "../../../types";
import { formatDistance, formatDuration, formatHr } from "../../../utils";

export {
  filterAndSortActivitiesBySearch,
  matchesActivitySearch,
  sortActivitiesByTime,
  ACTIVITY_LIST_SORT_OPTIONS,
  DEFAULT_ACTIVITY_LIST_SORT,
  isActivityDayGroupSort,
  sortActivities,
  type ActivityListSort,
} from "../../../lib/activitySearch";

export {
  activityDayKey,
  activityDayStripeFlags,
  formatActivityDayLabel,
  formatActivityWeekLabel,
  groupActivitiesByWeek,
  UNKNOWN_ACTIVITY_DAY_KEY,
} from "../../../lib/activityListGrouping";

export {
  ACTIVITY_DENSITY_WEEKS,
  buildActivityDensity,
  canSlideDensityEarlier,
  densityLevel,
  densityWeekRows,
  densityWindowEnd,
  formatDensityWindowLabel,
} from "../../../lib/activityDensity";

export { clusterActivitiesByRoute } from "../../../lib/activityRouteCluster";
export type { ActivityRouteCluster } from "../../../lib/activityRouteCluster";

export type ActivitiesBrowseMode = "timeline" | "route";

export const ACTIVITIES_BROWSE_MODE_OPTIONS: ReadonlyArray<{
  value: ActivitiesBrowseMode;
  label: string;
}> = [
  { value: "timeline", label: "Timeline" },
  { value: "route", label: "By route" },
];

/** Distance / duration / HR — primary stats under the title. */
export const activityStatsLine = (activity: ActivitySummary): string => {
  const parts: string[] = [];
  if (activity.distance_m != null) parts.push(formatDistance(activity.distance_m));
  if (activity.duration_sec != null) parts.push(formatDuration(activity.duration_sec));
  if (activity.avg_hr != null) parts.push(formatHr(activity.avg_hr));
  return parts.join(" · ");
};

/** Tags / location / format — secondary context. */
export const activityContextLine = (activity: ActivitySummary): string => {
  const parts: string[] = [];
  const tagLine = formatTags(activity.tags);
  if (tagLine) parts.push(tagLine);
  if (activity.location) parts.push(activity.location);
  parts.push(activity.source_format.toUpperCase());
  return parts.join(" · ");
};

/** @deprecated Prefer stats + context lines; kept for delete labels. */
export const activityMetaLine = (activity: ActivitySummary): string => {
  const stats = activityStatsLine(activity);
  const context = activityContextLine(activity);
  return [stats, context].filter(Boolean).join(" · ");
};

export const activityDeleteLabel = (activity: ActivitySummary): string =>
  [`#${activity.id} · ${activity.name}`, activity.source_filename, activityMetaLine(activity)].join(
    "\n",
  );

export const activityAvgSpeedKmh = (activity: ActivitySummary): number | null => {
  if (activity.distance_m == null || activity.duration_sec == null || activity.duration_sec <= 0) {
    return null;
  }
  return activity.distance_m / 1000 / (activity.duration_sec / 3600);
};

export const routeClusterMetaLine = (
  cluster: ActivityRouteCluster,
  now: Date = new Date(),
): string => {
  const count = cluster.activities.length;
  const parts: string[] = [
    `${count} ${count === 1 ? "activity" : "activities"}`,
  ];

  const latest = cluster.representative;
  const latestIso = latest.started_at ?? latest.created_at;
  if (latestIso) {
    const relative = formatRelativePast(latestIso, now);
    if (relative) parts.push(relative);
    else {
      const at = new Date(latestIso);
      if (!Number.isNaN(at.getTime())) parts.push(formatActivityDate(at));
    }
  }

  const distances = cluster.activities
    .map((row) => row.distance_m)
    .filter((value): value is number => value != null && Number.isFinite(value));
  if (distances.length > 0) {
    const min = Math.min(...distances);
    const max = Math.max(...distances);
    if (min === max) parts.push(formatDistance(min));
    else parts.push(`${formatDistance(min)}–${formatDistance(max)}`);
  }

  return parts.join(" · ");
};

export const activityListFiltersSummary = (
  sortLabel: string,
  searchQuery: string,
  browseMode: ActivitiesBrowseMode,
  dayFilterLabel: string | null,
): string => {
  const parts = [browseMode === "route" ? "By route" : sortLabel];
  const query = searchQuery.trim();
  if (query) parts.push(`“${query}”`);
  if (dayFilterLabel) parts.push(dayFilterLabel);
  return parts.join(" · ");
};

export const activityListFiltersAreActive = (
  sortIsDefault: boolean,
  searchQuery: string,
  browseMode: ActivitiesBrowseMode,
  dayFilter: string | null,
): boolean =>
  searchQuery.trim().length > 0 ||
  !sortIsDefault ||
  browseMode !== "timeline" ||
  dayFilter != null;
