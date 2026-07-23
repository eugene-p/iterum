import { describe, expect, it } from "vitest";
import { findSegmentSliceIndices } from "./segmentBoundary";

describe("findSegmentSliceIndices", () => {
  const points = [
    { lat: 48.0, lon: 16.0 },
    { lat: 48.001, lon: 16.001 },
    { lat: 48.002, lon: 16.002 },
    { lat: 48.003, lon: 16.003 },
  ];

  it("returns indices when start and end are within radius along the track", () => {
    expect(
      findSegmentSliceIndices(points, {
        start_lat: 48.0,
        start_lon: 16.0,
        end_lat: 48.003,
        end_lon: 16.003,
        radius_m: 50,
      }),
    ).toEqual({ startIdx: 0, endIdx: 3 });
  });

  it("returns null when end is not ahead of start", () => {
    expect(
      findSegmentSliceIndices(points, {
        start_lat: 48.003,
        start_lon: 16.003,
        end_lat: 48.0,
        end_lon: 16.0,
        radius_m: 50,
      }),
    ).toBeNull();
  });
});