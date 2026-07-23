import { describe, expect, it } from "vitest";
import {
  DEFAULT_STRETCH_THRESHOLDS,
  enrichStretch,
  segmentizeStretches,
  stretchAvgGradePct,
  stretchElevationDelta,
  stretchKindFromGrade,
  type StretchPoint,
} from "@/services/stretchSegmentation.js";

const linePoints = (
  count: number,
  spacingM: number,
  elevationAt: (index: number) => number | null,
): StretchPoint[] => {
  const points: StretchPoint[] = [];
  const metersPerDegLat = 111_320;
  for (let i = 0; i < count; i++) {
    const lat = 48 + (i * spacingM) / metersPerDegLat;
    points.push({ lat, lon: 16.37, elevation_m: elevationAt(i) });
  }
  return points;
};

describe("stretch grade helpers", () => {
  it("computes elevation delta, grade, and kind", () => {
    const stretch = {
      index: 1,
      start: { lat: 0, lon: 0, elevation_m: 100 },
      end: { lat: 0, lon: 0, elevation_m: 120 },
      length_m: 200,
    };
    expect(stretchElevationDelta(stretch)).toBe(20);
    expect(stretchAvgGradePct(stretch)).toBeCloseTo(10, 5);
    expect(stretchKindFromGrade(10, DEFAULT_STRETCH_THRESHOLDS)).toBe("climb");
    expect(stretchKindFromGrade(-10, DEFAULT_STRETCH_THRESHOLDS)).toBe("descent");
    expect(stretchKindFromGrade(0, DEFAULT_STRETCH_THRESHOLDS)).toBe("flat");
    expect(stretchAvgGradePct({ ...stretch, length_m: 0 })).toBe(0);

    const enriched = enrichStretch(stretch, DEFAULT_STRETCH_THRESHOLDS);
    expect(enriched.kind).toBe("climb");
    expect(enriched.elevation_delta_m).toBe(20);
  });
});

describe("segmentizeStretches", () => {
  it("classifies flat routes as flat", () => {
    const flat = segmentizeStretches(linePoints(40, 20, () => 100), {
      ...DEFAULT_STRETCH_THRESHOLDS,
      min_stretch_m: 30,
      max_stretch_m: 500,
    });
    expect(flat.stretches.length).toBeGreaterThanOrEqual(1);
    expect(flat.stretches.every((s) => s.kind === "flat")).toBe(true);
  });

  it("splits hills into climb and descent", () => {
    const hill = segmentizeStretches(
      linePoints(80, 20, (i) => {
        if (i < 20) return 100;
        if (i < 60) return 100 + (i - 20) * 2;
        return 180 - (i - 60) * 2;
      }),
      DEFAULT_STRETCH_THRESHOLDS,
    );
    expect(hill.stretches.length).toBeGreaterThanOrEqual(3);
    expect(hill.stretches.some((s) => s.kind === "climb")).toBe(true);
    expect(hill.stretches.some((s) => s.kind === "descent")).toBe(true);
  });

  it("splits long flats under max length", () => {
    const longFlat = segmentizeStretches(linePoints(120, 20, () => 50), {
      ...DEFAULT_STRETCH_THRESHOLDS,
      max_stretch_m: 300,
      max_stretch_pct: 0.2,
    });
    const longestFlat = Math.max(
      ...longFlat.stretches.filter((s) => s.kind === "flat").map((s) => s.length_m),
    );
    expect(longestFlat).toBeLessThanOrEqual(300.5);
  });

  it("classifies steady steep climbs as climb", () => {
    const steadyClimb = segmentizeStretches(
      linePoints(21, 6.3, (i) => 100 + (i * 16) / 20),
      DEFAULT_STRETCH_THRESHOLDS,
    );
    expect(steadyClimb.stretches.length).toBeGreaterThan(0);
    expect(steadyClimb.stretches.every((s) => s.kind === "climb")).toBe(true);
  });

  it("returns reasons for insufficient input", () => {
    expect(segmentizeStretches([]).reason).toMatch(/at least two points/i);
    expect(
      segmentizeStretches([
        { lat: 48, lon: 16, elevation_m: 10 },
        { lat: 48, lon: 16, elevation_m: 20 },
      ]).reason,
    ).toMatch(/no length/i);

    const noElevation = segmentizeStretches(linePoints(20, 20, () => null));
    expect(noElevation.stretches).toHaveLength(0);
    expect(noElevation.reason).toMatch(/elevation/i);
  });
});
