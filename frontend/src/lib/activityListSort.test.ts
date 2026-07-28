import { describe, expect, it } from "vitest";
import type { ActivitySummary } from "../types";
import {
  DEFAULT_ACTIVITY_LIST_SORT,
  isActivityDayGroupSort,
  sortActivities,
  type ActivityListSort,
} from "./activityListSort";

const base: ActivitySummary = {
  id: 1,
  name: "Run",
  created_at: "2024-06-15T10:00:00Z",
  source_format: "tcx",
  source_filename: "run.tcx",
  point_count: 100,
  tags: [],
  profile_id: 1,
  profile_name: "Default",
};

const activity = (overrides: Partial<ActivitySummary>): ActivitySummary => ({
  ...base,
  ...overrides,
});

describe("sortActivities", () => {
  it("defaults to newest first by resolved time", () => {
    const activities = [
      activity({ id: 1, started_at: "2024-01-01T10:00:00Z" }),
      activity({ id: 2, started_at: "2024-06-01T10:00:00Z" }),
      activity({ id: 3, started_at: "2024-03-01T10:00:00Z" }),
    ];

    expect(sortActivities(activities).map((row) => row.id)).toEqual([2, 3, 1]);
    expect(DEFAULT_ACTIVITY_LIST_SORT).toBe("newest");
  });

  it("sorts oldest first", () => {
    const activities = [
      activity({ id: 1, started_at: "2024-01-01T10:00:00Z" }),
      activity({ id: 2, started_at: "2024-06-01T10:00:00Z" }),
    ];

    expect(sortActivities(activities, "oldest").map((row) => row.id)).toEqual([1, 2]);
  });

  it("sorts longest distance first and falls back to newer on ties", () => {
    const activities = [
      activity({ id: 1, distance_m: 5000, started_at: "2024-06-01T10:00:00Z" }),
      activity({ id: 2, distance_m: 12000, started_at: "2024-01-01T10:00:00Z" }),
      activity({ id: 3, distance_m: 12000, started_at: "2024-06-01T12:00:00Z" }),
      activity({ id: 4, distance_m: null, started_at: "2024-07-01T10:00:00Z" }),
    ];

    expect(sortActivities(activities, "longest_distance").map((row) => row.id)).toEqual([
      3, 2, 1, 4,
    ]);
  });

  it("sorts longest duration first", () => {
    const activities = [
      activity({ id: 1, duration_sec: 1800, started_at: "2024-06-01T10:00:00Z" }),
      activity({ id: 2, duration_sec: 3600, started_at: "2024-01-01T10:00:00Z" }),
    ];

    expect(sortActivities(activities, "longest_duration").map((row) => row.id)).toEqual([2, 1]);
  });
});

describe("isActivityDayGroupSort", () => {
  it.each<ActivityListSort>(["newest", "oldest"])("true for %s", (sort) => {
    expect(isActivityDayGroupSort(sort)).toBe(true);
  });

  it.each<ActivityListSort>(["longest_distance", "longest_duration"])("false for %s", (sort) => {
    expect(isActivityDayGroupSort(sort)).toBe(false);
  });
});
