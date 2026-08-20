import { describe, expect, it } from "vitest";
import {
  createDurationIndex,
  createDurationStatsAccumulator,
} from "@/services/segmentBaselineStats.js";

describe("segment baseline duration statistics", () => {
  it("matches interpolated median and minimum for odd/even multisets", () => {
    const index = createDurationIndex([10, 20, 30, 30]);
    const stats = createDurationStatsAccumulator(index);
    stats.add(10);
    stats.add(20);
    stats.add(30);
    expect(stats.snapshot()).toEqual({
      sample_count: 3,
      typical_duration_sec: 20,
      best_duration_sec: 10,
    });
    stats.add(30);
    expect(stats.snapshot()).toEqual({
      sample_count: 4,
      typical_duration_sec: 25,
      best_duration_sec: 10,
    });
    stats.remove(10);
    expect(stats.snapshot()).toEqual({
      sample_count: 3,
      typical_duration_sec: 30,
      best_duration_sec: 20,
    });
  });

  it("ignores non-finite and non-positive durations", () => {
    const stats = createDurationStatsAccumulator(createDurationIndex([1, 2]));
    for (const duration of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) stats.add(duration);
    expect(stats.snapshot()).toEqual({
      sample_count: 0,
      typical_duration_sec: null,
      best_duration_sec: null,
    });
  });
});
