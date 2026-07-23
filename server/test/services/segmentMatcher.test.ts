import { describe, expect, it } from "vitest";
import {
  findAllSegmentPasses,
  shapeMatchScore,
  trimStartAtReturnLeg,
  type SegmentDefinition,
  type TrackPointRow,
} from "@/services/segmentMatcher.js";

function linePoints(
  count: number,
  spacingM: number,
  elevationAt: (index: number) => number,
): TrackPointRow[] {
  const points: TrackPointRow[] = [];
  const metersPerDegLat = 111_320;
  for (let i = 0; i < count; i++) {
    const lat = 48 + (i * spacingM) / metersPerDegLat;
    points.push({
      lat,
      lon: 16.37,
      elevation_m: elevationAt(i),
      heart_rate: null,
      speed_mps: null,
      timestamp: null,
    });
  }
  return points;
}

describe("shapeMatchScore", () => {
  it("scores matching paths higher than spatially offset paths", () => {
    const reference = linePoints(20, 20, () => 100);
    const offset = reference.map((point) => ({ ...point, lon: point.lon + 0.05 }));
    const match = shapeMatchScore(reference, reference, 40);
    const mismatch = shapeMatchScore(reference, offset, 40);

    expect(match).toBeGreaterThan(0.9);
    expect(mismatch).toBeLessThan(match);
  });
});

describe("segmentMatcher", () => {
  const uphillLeg = linePoints(51, 20, (i) => 100 + i * 2);
  const returnLeg = [...uphillLeg].reverse().slice(1);
  const activity = [...uphillLeg, ...returnLeg];
  const uphillReference = activity.slice(10, 41);
  const downhillReference = [...uphillReference].reverse();
  const topPoint = uphillReference.at(-1)!;
  const bottomPoint = uphillReference[0];

  const reversedDefinition: SegmentDefinition = {
    start_lat: topPoint.lat,
    start_lon: topPoint.lon,
    end_lat: bottomPoint.lat,
    end_lon: bottomPoint.lon,
    radius_m: 30,
    match_threshold: 0.85,
  };

  it("trims return-leg start past the uphill approach", () => {
    const rawStart = 40;
    const rawEnd = 90;
    const trimmedStart = trimStartAtReturnLeg(activity, rawStart, rawEnd, reversedDefinition);
    expect(trimmedStart).toBeGreaterThan(rawStart);

    const trimmedSlice = activity.slice(trimmedStart, rawEnd + 1);
    const midElevationDelta =
      (trimmedSlice[Math.floor(trimmedSlice.length / 2)].elevation_m ?? 0) -
      (trimmedSlice[0].elevation_m ?? 0);
    expect(midElevationDelta).toBeLessThan(0);
  });

  it("finds one downhill pass on an out-and-back", () => {
    const passes = findAllSegmentPasses(activity, reversedDefinition, downhillReference);
    expect(passes).toHaveLength(1);
    expect(passes[0].startIndex).toBeGreaterThan(40);
    expect(passes[0].endIndex).toBeGreaterThan(passes[0].startIndex);
  });

  it("still matches a forward uphill segment once", () => {
    const forwardDefinition: SegmentDefinition = {
      start_lat: bottomPoint.lat,
      start_lon: bottomPoint.lon,
      end_lat: topPoint.lat,
      end_lon: topPoint.lon,
      radius_m: 30,
      match_threshold: 0.85,
    };
    const uphillPasses = findAllSegmentPasses(activity, forwardDefinition, uphillReference);
    expect(uphillPasses).toHaveLength(1);
    expect(uphillPasses[0].startIndex).toBeLessThanOrEqual(10);
  });

  it("ignores extra climbing past the marker for downhill passes", () => {
    const summitLeg = linePoints(11, 20, (i) => 180 + i);
    const summitActivity = [...uphillLeg, ...summitLeg, ...returnLeg];
    const summitPasses = findAllSegmentPasses(
      summitActivity,
      reversedDefinition,
      downhillReference,
    );
    expect(summitPasses).toHaveLength(1);
    expect(summitPasses[0].startIndex).toBeGreaterThan(50);
  });
});
