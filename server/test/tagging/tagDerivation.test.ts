import { describe, expect, it } from "vitest";
import { deriveActivityTypeTag, sportToActivityTypeTag } from "@/tagging/deriveActivityTypeTag.js";
import { deriveDisplayName } from "@/tagging/deriveDisplayName.js";
import { deriveSegmentProfileTag } from "@/tagging/deriveSegmentProfileTag.js";
import { deriveTerrainTag } from "@/tagging/deriveTerrainTag.js";
import { deriveTimeOfDayTag, isTimeOfDayTag } from "@/tagging/deriveTimeOfDayTag.js";
import { normalizeTags } from "@/tagging/normalizeTags.js";
import {
  computeAvgSpeedKmh,
  computeDurationSec,
} from "@/tagging/trackMetrics.js";

const vancouverLon = -123.12;

describe("sportToActivityTypeTag", () => {
  it("maps common sport labels", () => {
    expect(sportToActivityTypeTag(null)).toBeNull();
    expect(sportToActivityTypeTag("")).toBeNull();
    expect(sportToActivityTypeTag("Walking")).toBe("walk");
    expect(sportToActivityTypeTag("Trail Run")).toBe("run");
    expect(sportToActivityTypeTag("Mountain Bike")).toBe("bike");
    expect(sportToActivityTypeTag("Cycling")).toBe("bike");
    expect(sportToActivityTypeTag("Hiking")).toBe("hike");
    expect(sportToActivityTypeTag("Swim")).toBeNull();
  });
});

describe("deriveActivityTypeTag", () => {
  it("prefers sport and falls back to speed", () => {
    expect(deriveActivityTypeTag("Walking", 12)).toBe("walk");
    expect(deriveActivityTypeTag(null, null)).toBeNull();
    expect(deriveActivityTypeTag(null, 4)).toBe("walk");
    expect(deriveActivityTypeTag(null, 8)).toBe("run");
  });
});

describe("deriveTimeOfDayTag", () => {
  it("maps local hour buckets from longitude offset", () => {
    // Vancouver is UTC-8; these UTC hours land in distinct local buckets.
    expect(deriveTimeOfDayTag(new Date("2024-06-15T16:00:00Z"), vancouverLon)).toBe("morning");
    expect(deriveTimeOfDayTag(new Date("2024-06-15T21:00:00Z"), vancouverLon)).toBe("afternoon");
    expect(deriveTimeOfDayTag(new Date("2024-06-15T02:00:00Z"), vancouverLon)).toBe("evening");
    expect(deriveTimeOfDayTag(new Date("2024-06-15T08:00:00Z"), vancouverLon)).toBe("night");
    expect(deriveTimeOfDayTag(null, vancouverLon)).toBeNull();
    expect(deriveTimeOfDayTag(new Date("2024-06-15T12:00:00Z"), null)).toBe("afternoon");
  });

  it("recognizes time-of-day tag strings", () => {
    expect(isTimeOfDayTag("morning")).toBe(true);
    expect(isTimeOfDayTag("run")).toBe(false);
  });
});

describe("deriveTerrainTag", () => {
  it("classifies terrain from grade thresholds", () => {
    expect(deriveTerrainTag(null, 1000)).toBeNull();
    expect(deriveTerrainTag(40, null)).toBeNull();
    expect(deriveTerrainTag(40, 0)).toBeNull();
    expect(deriveTerrainTag(40, 1000)).toBeNull();
    expect(deriveTerrainTag(50, 1000)).toBe("hills");
    expect(deriveTerrainTag(100, 1000)).toBe("mountains");
  });
});

describe("deriveDisplayName", () => {
  it("builds names from tag combinations", () => {
    expect(
      deriveDisplayName({ tags: ["morning", "run", "hills"], location: "Kitsilano" }),
    ).toBe("Morning run in Kitsilano (hills)");
    expect(deriveDisplayName({ tags: ["walk"], location: "Downtown" })).toBe("Walk in Downtown");
    expect(deriveDisplayName({ tags: ["evening"], location: null })).toBe("Evening");
    expect(deriveDisplayName({ tags: ["hills"], location: null })).toBe("(hills)");
    expect(deriveDisplayName({ tags: [], location: "Park" })).toBe("Park");
    expect(deriveDisplayName({ tags: [], location: null })).toBeNull();
  });
});

describe("deriveSegmentProfileTag", () => {
  it("returns null for short tracks and a dominant kind otherwise", () => {
    expect(deriveSegmentProfileTag([{ lat: 0, lon: 0, elevation_m: 1 }])).toBeNull();

    const climbPoints = Array.from({ length: 40 }, (_, i) => ({
      lat: 49.26 + i * 0.00018,
      lon: -123.15,
      elevation_m: 100 + i * 2,
      speed_mps: null,
      timestamp: null,
    }));
    expect(deriveSegmentProfileTag(climbPoints)).toBe("climb");
  });
});

describe("trackMetrics", () => {
  it("computes duration and average speed with fallbacks", () => {
    const points = [
      {
        lat: 0,
        lon: 0,
        elevation_m: 0,
        speed_mps: null,
        timestamp: "2024-01-01T10:00:00Z",
      },
      {
        lat: 0,
        lon: 0.001,
        elevation_m: 0,
        speed_mps: null,
        timestamp: "2024-01-01T10:10:00Z",
      },
    ];
    expect(computeDurationSec(points)).toBeCloseTo(600, 0);
    expect(computeDurationSec([{ ...points[0], timestamp: null }])).toBeNull();
    expect(computeAvgSpeedKmh(1000, 3600, points)).toBeCloseTo(1, 5);
    expect(
      computeAvgSpeedKmh(null, null, [
        { ...points[0], speed_mps: 2.5 },
        { ...points[1], speed_mps: 3.5 },
      ]),
    ).toBeCloseTo(10.8, 5);
    expect(computeAvgSpeedKmh(null, null, points)).toBeNull();
  });
});

describe("normalizeTags", () => {
  it("deduplicates and sorts tags", () => {
    expect(normalizeTags([" hills", "run", "run", ""])).toEqual(["hills", "run"]);
  });
});
