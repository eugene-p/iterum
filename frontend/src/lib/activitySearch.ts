import { activitySortTime } from "../activityDisplay";
import type { ActivitySummary, SegmentPass } from "../types";
import {
  DEFAULT_ACTIVITY_LIST_SORT,
  sortActivities,
  type ActivityListSort,
} from "./activityListSort";
import { matchesFuzzySearch, scoreFuzzySearch, type SearchFields } from "./fuzzySearch";

export type { ActivityListSort };
export {
  ACTIVITY_LIST_SORT_OPTIONS,
  DEFAULT_ACTIVITY_LIST_SORT,
  isActivityDayGroupSort,
  sortActivities,
} from "./activityListSort";

export const activitySearchFields = (activity: ActivitySummary): SearchFields => ({
  tags: activity.tags,
  name: activity.name,
  extras: [
    activity.location ?? "",
    activity.source_filename,
    activity.profile_name ?? "",
    String(activity.id),
    activity.sport ?? "",
    activity.source_format,
  ],
});

export const matchesActivitySearch = (activity: ActivitySummary, query: string): boolean =>
  matchesFuzzySearch(activitySearchFields(activity), query);

const passSortTime = (pass: SegmentPass): number =>
  activitySortTime({
    started_at: pass.started_at,
    created_at: pass.created_at,
    name: pass.activity_name,
    source_filename: pass.source_filename,
  });

export const sortSegmentPassesByTime = (passes: SegmentPass[]): SegmentPass[] =>
  [...passes].sort((a, b) => {
    const timeDiff = passSortTime(b) - passSortTime(a);
    if (timeDiff !== 0) return timeDiff;
    if (b.activity_id !== a.activity_id) return b.activity_id - a.activity_id;
    return a.pass_number - b.pass_number;
  });

export const sortActivitiesByTime = (activities: ActivitySummary[]): ActivitySummary[] =>
  sortActivities(activities, "newest");

export const filterAndSortActivitiesBySearch = (
  activities: ActivitySummary[],
  query: string,
  sort: ActivityListSort = DEFAULT_ACTIVITY_LIST_SORT,
): ActivitySummary[] => {
  const normalized = query.trim();
  if (!normalized) return sortActivities(activities, sort);

  const matched = activities
    .map((activity) => ({
      activity,
      ...scoreFuzzySearch(activitySearchFields(activity), normalized),
    }))
    .filter((row) => row.matches);

  const byScore = new Map<number, ActivitySummary[]>();
  for (const row of matched) {
    const bucket = byScore.get(row.score);
    if (bucket) bucket.push(row.activity);
    else byScore.set(row.score, [row.activity]);
  }

  const scores = [...byScore.keys()].sort((a, b) => b - a);
  return scores.flatMap((score) => sortActivities(byScore.get(score) ?? [], sort));
};
