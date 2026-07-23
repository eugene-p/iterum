import { describe, expect, it } from "vitest";
import type { TrackPoint } from "./types";
import {
  comparisonBaselineFromPoints,
  comparisonBaselineFromStretches,
  DEFAULT_STRETCH_THRESHOLDS,
  formatElevationDelta,
  isStretchPreviewDirty,
  slicePointsByDistance,
  speedKmhFromDistance,
  stretchAtFraction,
  stretchIndicesOnPass,
  stretchPointContextAtIndex,
  stretchProgressColor,
  stretchProgressScore,
  stretchThresholdQuery,
  thresholdsEqual,
} from "./stretchUtils";
import type { Stretch } from "./types";

const point = (
  lat: number,
  lon: number,
  elevation_m?: number | null,
  timestamp?: string,
): TrackPoint => ({ lat, lon, elevation_m, timestamp });

const makeStretch = (
  index: number,
  start: TrackPoint,
  end: TrackPoint,
  length_m: number,
  overrides: Partial<Stretch> = {},
): Stretch => ({
  index,
  start: {
    lat: start.lat,
    lon: start.lon,
    elevation_m: start.elevation_m ?? 0,
  },
  end: {
    lat: end.lat,
    lon: end.lon,
    elevation_m: end.elevation_m ?? 0,
  },
  length_m,
  kind: "flat",
  elevation_delta_m: (end.elevation_m ?? 0) - (start.elevation_m ?? 0),
  avg_grade_pct: 0,
  ...overrides,
});

describe("stretchUtils", () => {
  describe("stretchThresholdQuery", () => {
    it("serializes thresholds to query params", () => {
      const params = new URLSearchParams(stretchThresholdQuery(DEFAULT_STRETCH_THRESHOLDS));
      expect(params.get("climb_grade_pct")).toBe("3");
      expect(params.get("min_stretch_m")).toBe("50");
    });
  });

  describe("thresholdsEqual", () => {
    it("returns true for identical thresholds", () => {
      expect(thresholdsEqual(DEFAULT_STRETCH_THRESHOLDS, DEFAULT_STRETCH_THRESHOLDS)).toBe(true);
    });

    it("returns false when a value differs", () => {
      expect(
        thresholdsEqual(DEFAULT_STRETCH_THRESHOLDS, {
          ...DEFAULT_STRETCH_THRESHOLDS,
          min_stretch_m: 99,
        }),
      ).toBe(false);
    });
  });

  describe("isStretchPreviewDirty", () => {
    const baseline = {
      stretchSourceActivityId: 10,
      thresholds: DEFAULT_STRETCH_THRESHOLDS,
    };

    it("returns false when preview matches the saved baseline", () => {
      expect(
        isStretchPreviewDirty(
          {
            stretchSourceActivityId: 10,
            thresholds: DEFAULT_STRETCH_THRESHOLDS,
          },
          baseline,
        ),
      ).toBe(false);
    });

    it("returns true when preview changes the stretch source activity", () => {
      expect(isStretchPreviewDirty({ stretchSourceActivityId: 12 }, baseline)).toBe(true);
    });

    it("returns true when preview changes thresholds", () => {
      expect(
        isStretchPreviewDirty(
          {
            thresholds: { ...DEFAULT_STRETCH_THRESHOLDS, min_stretch_m: 99 },
          },
          baseline,
        ),
      ).toBe(true);
    });
  });

  describe("comparisonBaselineFromStretches", () => {
    it("sums stretch lengths and elevation deltas", () => {
      expect(
        comparisonBaselineFromStretches([
          makeStretch(1, point(0, 0, 100), point(0, 0.001, 120), 100, {
            elevation_delta_m: 20,
          }),
          makeStretch(2, point(0, 0.001, 120), point(0, 0.002, 105), 250, {
            elevation_delta_m: -15,
          }),
          makeStretch(3, point(0, 0.002, 105), point(0, 0.003, 110), 50, {
            elevation_delta_m: 5,
          }),
        ]),
      ).toEqual({
        distance_m: 400,
        elevation_delta_m: 10,
      });
    });

    it("returns null when there are no stretches", () => {
      expect(comparisonBaselineFromStretches([])).toBeNull();
    });
  });

  describe("comparisonBaselineFromPoints", () => {
    it("derives distance and net elevation from reference points", () => {
      const baseline = comparisonBaselineFromPoints([
        point(0, 0, 100),
        point(0, 0.001, 130),
        point(0, 0.002, 120),
      ]);
      expect(baseline).not.toBeNull();
      expect(baseline!.distance_m).toBeGreaterThan(0);
      expect(baseline!.elevation_delta_m).toBe(20);
    });

    it("returns null for short or empty tracks", () => {
      expect(comparisonBaselineFromPoints([])).toBeNull();
      expect(comparisonBaselineFromPoints([point(0, 0)])).toBeNull();
    });
  });

  describe("speedKmhFromDistance", () => {
    it("derives speed from distance and duration", () => {
      expect(speedKmhFromDistance(360, 1000)).toBeCloseTo(10);
    });

    it("returns null for invalid inputs", () => {
      expect(speedKmhFromDistance(null, 100)).toBeNull();
      expect(speedKmhFromDistance(0, 100)).toBeNull();
    });
  });

  describe("formatElevationDelta", () => {
    it("formats signed elevation change", () => {
      expect(formatElevationDelta(42.4)).toBe("+42 m");
      expect(formatElevationDelta(-18.6)).toBe("-19 m");
      expect(formatElevationDelta(0)).toBe("0 m");
    });
  });

  describe("stretchAtFraction", () => {
    const points = [
      point(0, 0, 100),
      point(0, 0.001, 110),
      point(0, 0.002, 110),
      point(0, 0.003, 110),
    ];
    const stretches: Stretch[] = [
      makeStretch(1, points[0], points[1], 100, {
        kind: "climb",
        elevation_delta_m: 10,
        avg_grade_pct: 10,
      }),
      makeStretch(2, points[1], points[3], 150, {
        kind: "flat",
        elevation_delta_m: 0,
        avg_grade_pct: 0,
      }),
    ];

    it("returns the stretch containing the fraction", () => {
      expect(stretchAtFraction(stretches, points, 0.2)?.index).toBe(1);
      expect(stretchAtFraction(stretches, points, 0.7)?.index).toBe(2);
    });

    it("returns null when no stretch matches", () => {
      expect(stretchAtFraction([], points, 0.5)).toBeNull();
    });
  });

  describe("stretchProgressScore", () => {
    const points = [
      point(0, 0, 100),
      point(0, 0.001, 110),
      point(0, 0.002, 110),
      point(0, 0.003, 110),
    ];
    const stretches: Stretch[] = [
      makeStretch(1, points[0], points[1], 100, {
        kind: "climb",
        elevation_delta_m: 10,
        avg_grade_pct: 10,
      }),
      makeStretch(2, points[2], points[3], 100, {
        kind: "flat",
        elevation_delta_m: 0,
        avg_grade_pct: 0,
      }),
    ];

    it("ranks later stretches ahead of earlier ones", () => {
      expect(
        stretchProgressScore(stretches, points, 0.2),
      ).toBeLessThan(stretchProgressScore(stretches, points, 0.7));
    });
  });

  describe("stretchProgressColor", () => {
    it("maps rank tiers to green, yellow, red, and gray", () => {
      expect(stretchProgressColor(0)).toBe("#7dffb0");
      expect(stretchProgressColor(1)).toBe("#f5c542");
      expect(stretchProgressColor(2)).toBe("#ff8f8f");
      expect(stretchProgressColor(5)).toBe("#4a4a4a");
    });
  });

  describe("stretchPointContextAtIndex", () => {
    const points = [
      point(0, 0, 100, "2024-01-01T10:00:00.000Z"),
      point(0, 0.001, 100, "2024-01-01T10:01:00.000Z"),
      point(0, 0.002, 100, "2024-01-01T10:02:00.000Z"),
      point(0, 0.003, 100, "2024-01-01T10:03:00.000Z"),
    ];
    const stretch = makeStretch(1, points[0], points[3], 100, {
      kind: "climb",
      elevation_delta_m: 10,
      avg_grade_pct: 10,
    });

    it("computes elapsed time and distance within the stretch", () => {
      const context = stretchPointContextAtIndex(points, stretch, 2, 180);
      expect(context.stretch?.index).toBe(1);
      expect(context.stretchElapsedSec).toBeCloseTo(120, 0);
      expect(context.stretchDistanceM).toBeGreaterThan(0);
    });
  });

  describe("stretchIndicesOnPass", () => {
    const points = [
      point(0, 0),
      point(0, 0.001),
      point(0, 0.002),
      point(0, 0.003),
    ];
    const stretch = makeStretch(1, points[1], points[2], 50);

    it("projects stretch boundaries onto pass points in order", () => {
      expect(stretchIndicesOnPass(points, stretch)).toEqual({ startIdx: 1, endIdx: 2 });
    });
  });

  describe("slicePointsByDistance", () => {
    const points = [
      point(0, 0),
      point(0, 0.001),
      point(0, 0.002),
      point(0, 0.003),
    ];

    it("returns a sub-slice between distance bounds", () => {
      const slice = slicePointsByDistance(points, 50, 200);
      expect(slice.length).toBeGreaterThan(0);
      expect(slice.length).toBeLessThanOrEqual(points.length);
    });

    it("returns a copy for short tracks", () => {
      expect(slicePointsByDistance([point(0, 0)], 0, 10)).toEqual([point(0, 0)]);
    });
  });
});