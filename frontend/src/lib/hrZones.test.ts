import { describe, expect, it } from "vitest";
import {
  computeHrZoneBands,
  computeHrZoneTimes,
  estimateMaxHrFromYearOfBirth,
  hrToZoneIndex,
  profileMaxHr,
} from "./hrZones";
import { hrToChartY } from "../components/activities/ActivityTrackChart/activityTrackChartUtils";
import type { TrackPoint } from "../types";

const point = (hr: number | null, timestamp?: string): TrackPoint => ({
  lat: 0,
  lon: 0,
  heart_rate: hr,
  timestamp: timestamp ?? null,
});

describe("estimateMaxHrFromYearOfBirth", () => {
  it("returns 220 minus age for a valid birth year", () => {
    expect(estimateMaxHrFromYearOfBirth(1990, 2026)).toBe(184);
  });

  it("returns null when year of birth is missing", () => {
    expect(estimateMaxHrFromYearOfBirth(null, 2026)).toBeNull();
    expect(estimateMaxHrFromYearOfBirth(undefined, 2026)).toBeNull();
  });

  it("returns null for implausible ages", () => {
    expect(estimateMaxHrFromYearOfBirth(2026, 2026)).toBeNull();
    expect(estimateMaxHrFromYearOfBirth(1800, 2026)).toBeNull();
  });
});

describe("profileMaxHr", () => {
  it("reads year of birth from a profile", () => {
    expect(profileMaxHr({ year_of_birth: 1985 })).toBe(220 - (new Date().getFullYear() - 1985));
  });

  it("returns null without a profile or birth year", () => {
    expect(profileMaxHr(null)).toBeNull();
    expect(profileMaxHr({ year_of_birth: null })).toBeNull();
  });
});

describe("hrToZoneIndex", () => {
  it("maps heart rate percentages to zone indices", () => {
    expect(hrToZoneIndex(90, 180)).toBe(0);
    expect(hrToZoneIndex(117, 180)).toBe(1);
    expect(hrToZoneIndex(135, 180)).toBe(2);
    expect(hrToZoneIndex(153, 180)).toBe(3);
    expect(hrToZoneIndex(171, 180)).toBe(4);
  });
});

describe("computeHrZoneBands", () => {
  it("returns visible zone bands within the chart scale", () => {
    const bands = computeHrZoneBands(180, { hrMin: 100, hrMax: 175 }, hrToChartY);
    expect(bands.map((band) => band.label)).toEqual(["Z1", "Z2", "Z3", "Z4", "Z5"]);
    expect(bands.every((band) => band.yBottom >= band.yTop)).toBe(true);
  });
});

describe("computeHrZoneTimes", () => {
  it("accumulates elapsed time per zone from track points", () => {
    const points = [
      point(100, "2026-01-01T10:00:00Z"),
      point(115, "2026-01-01T10:01:00Z"),
      point(130, "2026-01-01T10:03:00Z"),
    ];
    const zones = computeHrZoneTimes(points, 180);
    expect(zones.find((zone) => zone.label === "Z1")?.seconds).toBe(60);
    expect(zones.find((zone) => zone.label === "Z2")?.seconds).toBe(120);
  });

  it("uses duration when timestamps are missing", () => {
    const points = [point(100), point(115), point(130)];
    const zones = computeHrZoneTimes(points, 180, 120);
    expect(zones.find((zone) => zone.label === "Z1")?.seconds).toBe(60);
    expect(zones.find((zone) => zone.label === "Z2")?.seconds).toBe(60);
  });
});