import { formatTags } from "../../../lib/formatTags";
import type { ActivitySummary } from "../../../types";
import { formatDistance, formatDuration, formatHr } from "../../../utils";

export {
  filterAndSortActivitiesBySearch,
  matchesActivitySearch,
  sortActivitiesByTime,
} from "../../../lib/activitySearch";

export const activityMetaLine = (activity: ActivitySummary): string => {
  const parts: string[] = [];
  const tagLine = formatTags(activity.tags);
  if (tagLine) parts.push(tagLine);
  if (activity.location) parts.push(activity.location);
  if (activity.distance_m != null) parts.push(formatDistance(activity.distance_m));
  if (activity.duration_sec != null) parts.push(formatDuration(activity.duration_sec));
  if (activity.avg_hr != null) parts.push(formatHr(activity.avg_hr));
  parts.push(activity.source_format.toUpperCase());
  return parts.join(" · ");
};

export const activityDeleteLabel = (activity: ActivitySummary): string =>
  [`#${activity.id} · ${activity.name}`, activity.source_filename, activityMetaLine(activity)].join(
    "\n",
  );

export const activityAvgSpeedKmh = (activity: ActivitySummary): number | null => {
  if (activity.distance_m == null || activity.duration_sec == null || activity.duration_sec <= 0) {
    return null;
  }
  return (activity.distance_m / 1000) / (activity.duration_sec / 3600);
};