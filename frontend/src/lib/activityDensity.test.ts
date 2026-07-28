import { describe, expect, it } from "vitest";
import type { ActivitySummary } from "../types";
import {
  ACTIVITY_DENSITY_WEEKS,
  buildActivityDensity,
  canSlideDensityEarlier,
  densityLevel,
  densityWeekRows,
  densityWindowEnd,
  formatDensityWindowLabel,
  type DensityCell,
} from "./activityDensity";

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

describe("buildActivityDensity", () => {
  it("builds one cell per day for the requested week window ending today", () => {
    const now = new Date(2024, 6, 28, 12, 0, 0); // Sun Jul 28 2024 local
    const cells = buildActivityDensity([], { now, weeks: 2 });
    expect(cells).toHaveLength(14);
    expect(cells[0]?.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(cells.at(-1)?.dayKey).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
  });

  it("counts activities on matching local days", () => {
    const now = new Date(2024, 6, 28, 12, 0, 0);
    const activities = [
      activity({ id: 1, started_at: "2024-07-28T08:00:00" }),
      activity({ id: 2, started_at: "2024-07-28T18:00:00" }),
      activity({ id: 3, started_at: "2024-07-20T10:00:00" }),
    ];

    const cells = buildActivityDensity(activities, { now, weeks: 2 });
    const byKey = Object.fromEntries(cells.map((cell: DensityCell) => [cell.dayKey, cell.count]));
    const todayKey = cells.at(-1)!.dayKey;
    expect(byKey[todayKey]).toBe(2);
    expect(Object.values(byKey).reduce((sum, n) => sum + n, 0)).toBeGreaterThanOrEqual(2);
  });

  it("defaults to a two-week sliding window", () => {
    expect(ACTIVITY_DENSITY_WEEKS).toBe(2);
    const cells = buildActivityDensity([], { now: new Date(2024, 6, 28) });
    expect(cells).toHaveLength(14);
  });

  it("supports an explicit endDate for sliding back in time", () => {
    const end = new Date(2024, 6, 14);
    const cells = buildActivityDensity([], { endDate: end, weeks: 2 });
    expect(cells.at(-1)?.dayKey).toBe("2024-07-14");
    expect(cells[0]?.dayKey).toBe("2024-07-01");
  });
});

describe("densityWindowEnd", () => {
  it("shifts the window end back by offset weeks", () => {
    const now = new Date(2024, 6, 28, 12, 0, 0);
    expect(densityWindowEnd(0, now).getDate()).toBe(28);
    expect(densityWindowEnd(1, now).getDate()).toBe(21);
    expect(densityWindowEnd(2, now).getDate()).toBe(14);
  });
});

describe("canSlideDensityEarlier", () => {
  const now = new Date(2024, 6, 28, 12, 0, 0);

  it("is false when there are no dated activities", () => {
    expect(canSlideDensityEarlier([], 0, now)).toBe(false);
  });

  it("is false when the oldest activity is already in the 14-day window", () => {
    // Window at offset 0: Jul 15–28; oldest on Jul 20 is inside
    const activities = [activity({ id: 1, started_at: "2024-07-20T10:00:00" })];
    expect(canSlideDensityEarlier(activities, 0, now)).toBe(false);
  });

  it("is true when the oldest activity is before the visible window", () => {
    // Window at offset 0: Jul 15–28; oldest on Jul 1 is before
    const activities = [activity({ id: 1, started_at: "2024-07-01T10:00:00" })];
    expect(canSlideDensityEarlier(activities, 0, now)).toBe(true);
  });

  it("turns false once the window has slid to include the oldest activity", () => {
    // Offset 2: Jul 1–14 includes Jul 1
    const activities = [activity({ id: 1, started_at: "2024-07-01T10:00:00" })];
    expect(canSlideDensityEarlier(activities, 2, now)).toBe(false);
  });
});

describe("formatDensityWindowLabel", () => {
  it("formats a single range for the window", () => {
    const cells = buildActivityDensity([], { now: new Date(2024, 6, 28), weeks: 2 });
    const label = formatDensityWindowLabel(cells, new Date(2024, 6, 28));
    expect(label).toMatch(/Jul/);
    expect(label).toContain("–");
  });
});

describe("densityWeekRows", () => {
  it("splits into two rows of seven", () => {
    const cells = buildActivityDensity([], { now: new Date(2024, 6, 28), weeks: 2 });
    const rows = densityWeekRows(cells);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveLength(7);
    expect(rows[1]).toHaveLength(7);
    expect(rows[0]?.[0]?.dayKey).toBe(cells[0]?.dayKey);
    expect(rows[1]?.[6]?.dayKey).toBe(cells[13]?.dayKey);
  });
});

describe("densityLevel", () => {
  it("maps counts into discrete levels", () => {
    expect(densityLevel(0, 5)).toBe(0);
    expect(densityLevel(1, 5)).toBeGreaterThan(0);
    expect(densityLevel(5, 5)).toBe(4);
    expect(densityLevel(3, 0)).toBe(0);
  });
});
