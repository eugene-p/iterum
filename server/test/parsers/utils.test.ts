import { describe, expect, it } from "vitest";
import { BadRequestError } from "@/middleware/errors.js";
import {
  finalizeActivity,
  parseDate,
  parseDateFromText,
  parseNumber,
  semicirclesToDegrees,
  sortPoints,
} from "@/parsers/utils.js";

describe("parseNumber", () => {
  it("returns null for empty or non-finite values", () => {
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("nope")).toBeNull();
    expect(parseNumber(42)).toBe(42);
  });
});

describe("parseDate", () => {
  it("parses ISO strings and rejects invalid values", () => {
    expect(parseDate("2024-01-01T10:00:00Z")?.toISOString()).toBe("2024-01-01T10:00:00.000Z");
    expect(parseDate(null)).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("not-a-date")).toBeNull();
  });
});

describe("parseDateFromText", () => {
  it("parses common filename timestamps", () => {
    const spaced = parseDateFromText("2024-06-15 10:30 — ride.gpx");
    expect(spaced?.getFullYear()).toBe(2024);
    expect(spaced?.getMonth()).toBe(5);
    expect(spaced?.getDate()).toBe(15);
    expect(spaced?.getHours()).toBe(10);
    expect(spaced?.getMinutes()).toBe(30);

    const compact = parseDateFromText("activity_20240615_103045.gpx");
    expect(compact?.getFullYear()).toBe(2024);
    expect(compact?.getHours()).toBe(10);
    expect(compact?.getMinutes()).toBe(30);

    const dateOnly = parseDateFromText("notes-2024-06-15-end");
    expect(dateOnly?.getFullYear()).toBe(2024);
    expect(dateOnly?.getMonth()).toBe(5);
    expect(dateOnly?.getDate()).toBe(15);
  });

  it("returns null when no date is recognizable", () => {
    expect(parseDateFromText("untitled activity")).toBeNull();
  });
});

describe("semicirclesToDegrees", () => {
  it("converts FIT semicircles", () => {
    expect(semicirclesToDegrees(0)).toBe(0);
    expect(semicirclesToDegrees(2 ** 31 / 2)).toBeCloseTo(90, 5);
  });
});

describe("sortPoints", () => {
  it("orders by timestamp when both are present", () => {
    const t0 = new Date("2024-01-01T10:00:00Z");
    const t1 = new Date("2024-01-01T10:01:00Z");
    const sorted = sortPoints([
      {
        timestamp: t1,
        lat: 1,
        lon: 1,
        elevationM: null,
        heartRate: null,
        speedMps: null,
        distanceM: null,
      },
      {
        timestamp: t0,
        lat: 0,
        lon: 0,
        elevationM: null,
        heartRate: null,
        speedMps: null,
        distanceM: null,
      },
    ]);
    expect(sorted[0].timestamp).toEqual(t0);
  });
});

describe("finalizeActivity", () => {
  it("rejects activities without valid GPS points", () => {
    expect(() =>
      finalizeActivity(
        {
          name: "empty",
          sport: null,
          startedAt: null,
          durationSec: null,
          distanceM: null,
          points: [],
        },
        "empty.gpx",
      ),
    ).toThrow(BadRequestError);
  });

  it("derives duration and heart rate stats from points", () => {
    const t0 = new Date("2024-01-01T10:00:00Z");
    const t1 = new Date("2024-01-01T10:10:00Z");
    const activity = finalizeActivity(
      {
        name: "ride",
        sport: null,
        startedAt: null,
        durationSec: null,
        distanceM: null,
        points: [
          {
            timestamp: t0,
            lat: 48,
            lon: 16,
            elevationM: null,
            heartRate: 120,
            speedMps: null,
            distanceM: null,
          },
          {
            timestamp: t1,
            lat: 48.001,
            lon: 16,
            elevationM: null,
            heartRate: 140,
            speedMps: null,
            distanceM: 1200,
          },
        ],
      },
      "ride.gpx",
    );

    expect(activity.durationSec).toBeCloseTo(600, 0);
    expect(activity.avgHr).toBe(130);
    expect(activity.maxHr).toBe(140);
    expect(activity.distanceM).toBe(1200);
    expect(activity.startedAt).toEqual(t0);
  });

  it("falls back to filename timestamp and preserves provided stats", () => {
    const activity = finalizeActivity(
      {
        name: null,
        sport: "Run",
        startedAt: null,
        durationSec: 100,
        distanceM: 500,
        avgHr: 110,
        maxHr: 150,
        points: [
          {
            timestamp: null,
            lat: 48,
            lon: 16,
            elevationM: null,
            heartRate: null,
            speedMps: null,
            distanceM: null,
          },
          {
            timestamp: null,
            lat: 48.001,
            lon: 16,
            elevationM: null,
            heartRate: null,
            speedMps: null,
            distanceM: null,
          },
        ],
      },
      "2024-06-15 08:00 — morning.gpx",
    );

    expect(activity.sport).toBe("Run");
    expect(activity.durationSec).toBe(100);
    expect(activity.distanceM).toBe(500);
    expect(activity.avgHr).toBe(110);
    expect(activity.maxHr).toBe(150);
    expect(activity.startedAt?.getFullYear()).toBe(2024);
    expect(activity.name).toContain("morning.gpx");
  });
});
