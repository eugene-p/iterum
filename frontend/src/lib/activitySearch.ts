import { activitySortTime } from "../activityDisplay";
import type { ActivitySummary, SegmentPass } from "../types";
import { matchesFuzzySearch, scoreFuzzySearch, type SearchFields } from "./fuzzySearch";

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
  [...activities].sort(
    (a, b) =>
      activitySortTime({
        started_at: b.started_at,
        created_at: b.created_at,
        name: b.name,
        source_filename: b.source_filename,
      }) -
      activitySortTime({
        started_at: a.started_at,
        created_at: a.created_at,
        name: a.name,
        source_filename: a.source_filename,
      }),
  );

export const filterAndSortActivitiesBySearch = (
  activities: ActivitySummary[],
  query: string,
): ActivitySummary[] => {
  const normalized = query.trim();
  if (!normalized) return sortActivitiesByTime(activities);

  return [...activities]
    .map((activity) => ({
      activity,
      ...scoreFuzzySearch(activitySearchFields(activity), normalized),
    }))
    .filter((row) => row.matches)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        activitySortTime({
          started_at: b.activity.started_at,
          created_at: b.activity.created_at,
          name: b.activity.name,
          source_filename: b.activity.source_filename,
        }) -
        activitySortTime({
          started_at: a.activity.started_at,
          created_at: a.activity.created_at,
          name: a.activity.name,
          source_filename: a.activity.source_filename,
        })
      );
    })
    .map((row) => row.activity);
};