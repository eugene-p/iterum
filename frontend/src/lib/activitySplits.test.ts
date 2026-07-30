import { describe, expect, it } from "vitest";
import type { TrackPoint } from "../types";
import { buildActivitySplits, formatSplitPace, splitIntervalM } from "./activitySplits";

const point = (distance_m: number, timestamp: string, heart_rate = 120): TrackPoint => ({
  lat: 48,
  lon: -123 + distance_m / 100_000,
  distance_m,
  timestamp,
  heart_rate,
});

describe("activity splits", () => {
  it("uses the profile unit to choose the automatic interval", () => {
    expect(splitIntervalM({ distance_unit: "km", split_distance_m: 500 })).toBe(500);
    expect(splitIntervalM({ distance_unit: "mi", split_distance_m: 2735.8848 })).toBeCloseTo(2735.8848);
  });

  it("builds a final partial split from imported cumulative distance", () => {
    const splits = buildActivitySplits(
      [
        point(0, "2026-01-01T10:00:00Z", 100),
        point(500, "2026-01-01T10:05:00Z", 110),
        point(1000, "2026-01-01T10:10:00Z", 120),
        point(1500, "2026-01-01T10:15:00Z", 130),
        point(1800, "2026-01-01T10:18:00Z", 140),
      ],
      1000,
    );

    expect(splits).toHaveLength(2);
    expect(splits[0]).toMatchObject({ index: 1, distance_m: 1000, duration_sec: 600 });
    expect(splits[1]).toMatchObject({ index: 2, distance_m: 800, duration_sec: 480 });
    expect(splits[0].avg_hr).toBe(110);
  });

  it("formats pace in the selected distance unit", () => {
    expect(formatSplitPace(300, 1000, "km")).toBe("5:00 /km");
    expect(formatSplitPace(600, 1609.344, "mi")).toBe("10:00 /mi");
  });
});
