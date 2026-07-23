import { describe, expect, it } from "vitest";
import { cumulativeDistancesM, elevationGainM, pathDistanceM } from "@/geo/pathMetrics.js";

describe("pathMetrics", () => {
  it("sums only positive elevation changes", () => {
    expect(
      elevationGainM([
        { lat: 0, lon: 0, elevation_m: 100 },
        { lat: 0, lon: 0.001, elevation_m: 150 },
        { lat: 0, lon: 0.002, elevation_m: 120 },
      ]),
    ).toBe(50);
  });

  it("returns null without enough elevation samples", () => {
    expect(elevationGainM([{ lat: 0, lon: 0, elevation_m: 100 }])).toBeNull();
  });

  it("builds monotonic cumulative distances", () => {
    const points = [
      { lat: 48.0, lon: 16.0 },
      { lat: 48.001, lon: 16.0 },
      { lat: 48.002, lon: 16.0 },
    ];
    const cumulative = cumulativeDistancesM(points);
    expect(cumulative[0]).toBe(0);
    expect(cumulative.at(-1)).toBe(pathDistanceM(points));
    expect(cumulative[2]).toBeGreaterThan(cumulative[1]);
  });
});