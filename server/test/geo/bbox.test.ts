import { describe, expect, it } from "vitest";
import {
  gateBoundsFromPoint,
  metersToLatDelta,
  metersToLonDelta,
  segmentGateBounds,
  unionBounds,
} from "@/geo/bbox.js";

describe("bbox", () => {
  it("converts meters to lat/lon deltas", () => {
    const latPad = metersToLatDelta(30);
    expect(Math.abs(latPad - 30 / 111_320)).toBeLessThan(1e-12);
    expect(metersToLonDelta(30, 48)).toBeGreaterThan(latPad);
  });

  it("builds gate and union bounds", () => {
    const latPad = metersToLatDelta(30);
    const gate = gateBoundsFromPoint(48, 16, 30);
    expect(Math.abs(gate.min_lat - (48 - latPad))).toBeLessThan(1e-9);
    expect(Math.abs(gate.max_lat - (48 + latPad))).toBeLessThan(1e-9);
    expect(gate.min_lon).toBeLessThan(16);
    expect(gate.max_lon).toBeGreaterThan(16);

    const union = unionBounds(
      { min_lat: 1, max_lat: 2, min_lon: 3, max_lon: 4 },
      { min_lat: 0, max_lat: 3, min_lon: 2, max_lon: 5 },
    );
    expect(union).toEqual({ min_lat: 0, max_lat: 3, min_lon: 2, max_lon: 5 });

    const segment = segmentGateBounds({
      start_lat: 48,
      start_lon: 16,
      end_lat: 48.01,
      end_lon: 16.01,
      radius_m: 30,
    });
    expect(segment.union.min_lat).toBeLessThanOrEqual(segment.start.min_lat);
    expect(segment.union.max_lat).toBeGreaterThanOrEqual(segment.end.max_lat);
  });
});
