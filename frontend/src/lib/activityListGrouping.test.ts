import { describe, expect, it } from "vitest";
import type { ActivitySummary } from "../types";
import {
  activityDayKey,
  activityDayStripeFlags,
  activityWeekKey,
  formatActivityDayLabel,
  formatActivityWeekLabel,
  groupActivitiesByDay,
  groupActivitiesByWeek,
  startOfLocalWeek,
} from "./activityListGrouping";

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

describe("activityDayKey", () => {
  it("uses local calendar day from started_at", () => {
    const row = activity({ started_at: "2024-07-22T15:30:00" });
    const key = activityDayKey(row);
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(key).toBe(activityDayKey(row));
  });

  it("returns null when no resolvable time", () => {
    expect(
      activityDayKey(
        activity({
          started_at: null,
          created_at: "not-a-date",
          name: "untitled",
          source_filename: "x.fit",
        }),
      ),
    ).toBeNull();
  });
});

describe("groupActivitiesByDay", () => {
  const now = new Date(2024, 6, 28, 12, 0, 0);

  it("groups by local day, newest day first, preserves within-day order", () => {
    const activities = [
      activity({ id: 1, started_at: "2024-07-22T07:00:00" }),
      activity({ id: 2, started_at: "2024-07-23T18:00:00" }),
      activity({ id: 3, started_at: "2024-07-22T18:00:00" }),
    ];

    const groups = groupActivitiesByDay(activities, "newest", now);
    expect(groups.map((g) => g.dayKey)).toEqual([
      activityDayKey(activities[1]),
      activityDayKey(activities[0]),
    ]);
    // Within day: newest time first (18:00 before 07:00).
    expect(groups[1]?.activities.map((a) => a.id)).toEqual([3, 1]);
  });

  it("orders days oldest-first when sort is oldest", () => {
    const activities = [
      activity({ id: 1, started_at: "2024-07-22T07:00:00" }),
      activity({ id: 2, started_at: "2024-07-23T18:00:00" }),
    ];

    const groups = groupActivitiesByDay(activities, "oldest", now);
    expect(groups.map((g) => g.activities.map((a) => a.id))).toEqual([[1], [2]]);
  });

  it("puts undated activities in a final unknown group", () => {
    const activities = [
      activity({
        id: 1,
        started_at: null,
        created_at: "bad",
        name: "x",
        source_filename: "x.fit",
      }),
      activity({ id: 2, started_at: "2024-07-22T07:00:00" }),
    ];

    const groups = groupActivitiesByDay(activities, "newest", now);
    expect(groups.at(-1)?.dayKey).toBe("unknown");
    expect(groups.at(-1)?.activities.map((a) => a.id)).toEqual([1]);
  });
});

describe("formatActivityDayLabel", () => {
  it("includes weekday and month day", () => {
    const now = new Date(2024, 6, 28);
    const label = formatActivityDayLabel("2024-07-22", now);
    expect(label).toMatch(/Jul/);
    expect(label).toMatch(/22/);
  });

  it("labels unknown day", () => {
    expect(formatActivityDayLabel("unknown")).toBe("Unknown date");
  });
});

describe("activityDayStripeFlags", () => {
  it("shares a stripe for the same day and flips when the day changes", () => {
    const activities = [
      activity({ id: 1, started_at: "2024-07-22T07:00:00" }),
      activity({ id: 2, started_at: "2024-07-22T18:00:00" }),
      activity({ id: 3, started_at: "2024-07-23T09:00:00" }),
      activity({ id: 4, started_at: "2024-07-24T09:00:00" }),
    ];

    expect(activityDayStripeFlags(activities)).toEqual([false, false, true, false]);
  });
});

describe("groupActivitiesByWeek", () => {
  const now = new Date(2024, 6, 28, 12, 0, 0);

  it("groups Monday-start weeks with newest week first", () => {
    // Mon Jul 22 2024, Sun Jul 28 2024, Mon Jul 15 2024
    const activities = [
      activity({ id: 1, started_at: "2024-07-22T07:00:00" }),
      activity({ id: 2, started_at: "2024-07-28T18:00:00" }),
      activity({ id: 3, started_at: "2024-07-15T09:00:00" }),
    ];

    const groups = groupActivitiesByWeek(activities, "newest", now);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.activities.map((a) => a.id).sort()).toEqual([1, 2]);
    expect(groups[1]?.activities.map((a) => a.id)).toEqual([3]);
    expect(groups[0]?.label).toBe("This week");
  });

  it("labels non-current weeks as a date range", () => {
    const weekStart = startOfLocalWeek(new Date(2024, 6, 15));
    const key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    expect(formatActivityWeekLabel(key, now)).toMatch(/Jul/);
    expect(formatActivityWeekLabel(key, now)).toContain("–");
  });

  it("derives the same week key for days in the same week", () => {
    const mon = activity({ id: 1, started_at: "2024-07-22T07:00:00" });
    const sun = activity({ id: 2, started_at: "2024-07-28T18:00:00" });
    expect(activityWeekKey(mon)).toBe(activityWeekKey(sun));
  });
});
