import { activitySortTime } from "../activityDisplay";
import type { ActivitySummary } from "../types";

export type ActivityListSort =
  | "newest"
  | "oldest"
  | "longest_distance"
  | "longest_duration";

export const DEFAULT_ACTIVITY_LIST_SORT: ActivityListSort = "newest";

export const ACTIVITY_LIST_SORT_OPTIONS: ReadonlyArray<{
  value: ActivityListSort;
  label: string;
}> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "longest_distance", label: "Longest distance" },
  { value: "longest_duration", label: "Longest duration" },
];

export const isActivityDayGroupSort = (sort: ActivityListSort): boolean =>
  sort === "newest" || sort === "oldest";

const timeOf = (activity: ActivitySummary): number =>
  activitySortTime({
    started_at: activity.started_at,
    created_at: activity.created_at,
    name: activity.name,
    source_filename: activity.source_filename,
  });

const distanceOf = (activity: ActivitySummary): number => activity.distance_m ?? -1;

const durationOf = (activity: ActivitySummary): number => activity.duration_sec ?? -1;

const compareNewestFirst = (a: ActivitySummary, b: ActivitySummary): number => {
  const byTime = timeOf(b) - timeOf(a);
  if (byTime !== 0) return byTime;
  return b.id - a.id;
};

const compareOldestFirst = (a: ActivitySummary, b: ActivitySummary): number => {
  const byTime = timeOf(a) - timeOf(b);
  if (byTime !== 0) return byTime;
  return a.id - b.id;
};

const compareBySort = (
  a: ActivitySummary,
  b: ActivitySummary,
  sort: ActivityListSort,
): number => {
  if (sort === "oldest") return compareOldestFirst(a, b);

  if (sort === "longest_distance") {
    const byDistance = distanceOf(b) - distanceOf(a);
    if (byDistance !== 0) return byDistance;
    return compareNewestFirst(a, b);
  }

  if (sort === "longest_duration") {
    const byDuration = durationOf(b) - durationOf(a);
    if (byDuration !== 0) return byDuration;
    return compareNewestFirst(a, b);
  }

  return compareNewestFirst(a, b);
};

export const sortActivities = (
  activities: readonly ActivitySummary[],
  sort: ActivityListSort = DEFAULT_ACTIVITY_LIST_SORT,
): ActivitySummary[] => [...activities].sort((a, b) => compareBySort(a, b, sort));
