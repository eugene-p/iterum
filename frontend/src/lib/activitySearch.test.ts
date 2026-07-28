import { describe, expect, it } from "vitest";
import type { ActivitySummary, SegmentPass } from "../types";
import {
  filterAndSortActivitiesBySearch,
  sortActivitiesByTime,
  sortSegmentPassesByTime,
} from "./activitySearch";

const baseActivity: ActivitySummary = {
  id: 1,
  name: "Morning run in Kitsilano (hills)",
  created_at: "2024-06-15T10:00:00Z",
  source_format: "tcx",
  source_filename: "run.tcx",
  point_count: 100,
  tags: ["morning", "run", "hills"],
  location: "Kitsilano",
  profile_id: 1,
  profile_name: "Default",
};

const basePass = (overrides: Partial<SegmentPass>): SegmentPass => ({
  id: 1,
  activity_id: 1,
  activity_name: "Run",
  pass_number: 1,
  match_score: 1,
  matched: true,
  ...overrides,
});

describe("sortActivitiesByTime", () => {
  it("orders newest started_at first", () => {
    const activities: ActivitySummary[] = [
      { ...baseActivity, id: 1, started_at: "2024-01-01T10:00:00Z" },
      { ...baseActivity, id: 2, started_at: "2024-06-01T10:00:00Z" },
      { ...baseActivity, id: 3, started_at: "2024-03-01T10:00:00Z" },
    ];

    expect(sortActivitiesByTime(activities).map((activity) => activity.id)).toEqual([2, 3, 1]);
  });
});

describe("sortSegmentPassesByTime", () => {
  it("orders newest activity first and pass_number within the same activity", () => {
    const passes: SegmentPass[] = [
      basePass({
        id: 1,
        activity_id: 10,
        activity_name: "Alpha",
        started_at: "2024-01-01T10:00:00Z",
        pass_number: 1,
      }),
      basePass({
        id: 2,
        activity_id: 20,
        activity_name: "Zulu",
        started_at: "2024-06-01T10:00:00Z",
        pass_number: 1,
      }),
      basePass({
        id: 3,
        activity_id: 20,
        activity_name: "Zulu",
        started_at: "2024-06-01T10:00:00Z",
        pass_number: 2,
      }),
    ];

    expect(sortSegmentPassesByTime(passes).map((pass) => pass.id)).toEqual([2, 3, 1]);
  });
});

describe("filterAndSortActivitiesBySearch", () => {
  it("ranks tag matches ahead of name matches", () => {
    const activities: ActivitySummary[] = [
      { ...baseActivity, id: 1, name: "Kitsilano loop", tags: ["afternoon", "walk"] },
      { ...baseActivity, id: 2, tags: ["run"] },
    ];

    const results = filterAndSortActivitiesBySearch(activities, "run");
    expect(results.map((activity) => activity.id)).toEqual([2, 1]);
  });

  it("applies list sort within equal search scores", () => {
    const activities: ActivitySummary[] = [
      {
        ...baseActivity,
        id: 1,
        name: "run A",
        tags: ["run"],
        distance_m: 5_000,
        started_at: "2024-06-01T10:00:00Z",
      },
      {
        ...baseActivity,
        id: 2,
        name: "run B",
        tags: ["run"],
        distance_m: 12_000,
        started_at: "2024-01-01T10:00:00Z",
      },
    ];

    const results = filterAndSortActivitiesBySearch(activities, "run", "longest_distance");
    expect(results.map((activity) => activity.id)).toEqual([2, 1]);
  });
});