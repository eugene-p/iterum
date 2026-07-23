import { describe, expect, it } from "vitest";
import { deriveActivityTags } from "@/tagging/deriveActivityTags.js";
import { deriveDisplayName } from "@/tagging/deriveDisplayName.js";
import { deriveSegmentTags } from "@/tagging/deriveSegmentTags.js";
import { computeElevationGain, computeTrackDistanceM } from "@/tagging/trackMetrics.js";

const vancouverLon = -123.12;

describe("tagging", () => {
  it("derives activity tags from sport, pace, and grade", () => {
    const morningTags = deriveActivityTags({
      sport: "Running",
      startedAt: new Date("2024-06-15T16:00:00Z"),
      distanceM: 5000,
      durationSec: 1800,
      elevationGainM: 300,
      startLon: vancouverLon,
    });
    expect(morningTags).toEqual(expect.arrayContaining(["morning", "run", "hills"]));

    const walkTags = deriveActivityTags({
      sport: null,
      startedAt: new Date("2024-06-15T22:00:00Z"),
      distanceM: 2000,
      durationSec: 3600,
      elevationGainM: 20,
      startLon: vancouverLon,
    });
    expect(walkTags).toContain("walk");
    expect(walkTags).not.toContain("hills");

    const mountainTags = deriveActivityTags({
      sport: null,
      startedAt: new Date("2024-06-15T20:00:00Z"),
      distanceM: 4000,
      durationSec: 2400,
      elevationGainM: 500,
      startLon: vancouverLon,
    });
    expect(mountainTags).toContain("mountains");
    expect(mountainTags).not.toContain("hills");

    const sportWalkOverridesSpeed = deriveActivityTags({
      sport: "Walking",
      startedAt: new Date("2024-06-15T16:00:00Z"),
      distanceM: 5000,
      durationSec: 600,
      elevationGainM: 0,
      startLon: vancouverLon,
    });
    expect(sportWalkOverridesSpeed).toContain("walk");
    expect(sportWalkOverridesSpeed).not.toContain("run");
  });

  it("derives segment tags without time-of-day", () => {
    const climbPoints = Array.from({ length: 40 }, (_, i) => ({
      lat: 49.26 + i * 0.00018,
      lon: -123.15,
      elevation_m: 100 + i * 2,
      speed_mps: 2.5,
      timestamp: null,
    }));

    const segmentTags = deriveSegmentTags({
      points: climbPoints,
      activitySport: "Running",
    });
    expect(segmentTags).not.toContain("morning");
    expect(segmentTags).toEqual(expect.arrayContaining(["run", "climb"]));
  });

  it("computes elevation gain and track distance", () => {
    expect(
      computeElevationGain([
        { lat: 0, lon: 0, elevation_m: 100 },
        { lat: 0, lon: 0.001, elevation_m: 150 },
      ]),
    ).toBe(50);

    expect(
      computeTrackDistanceM([
        { lat: 49.0, lon: -123.0, elevation_m: null },
        { lat: 49.001, lon: -123.0, elevation_m: null },
      ]),
    ).toBeGreaterThan(100);
  });

  it("builds display names", () => {
    expect(
      deriveDisplayName({ tags: ["morning", "run", "hills"], location: "Kitsilano" }),
    ).toBe("Morning run in Kitsilano (hills)");
    expect(deriveDisplayName({ tags: ["walk"], location: "Downtown" })).toBe(
      "Walk in Downtown",
    );
    expect(deriveDisplayName({ tags: [], location: null })).toBeNull();
  });
});
