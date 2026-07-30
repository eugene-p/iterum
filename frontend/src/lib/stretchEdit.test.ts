import { describe, expect, it } from "vitest";
import type { Stretch, StretchThresholds } from "../types";
import { DEFAULT_STRETCH_THRESHOLDS } from "./stretchThresholds";
import {
  findShortStretchNudges,
  mergeStretches,
  moveBoundary,
  pointAtPathDistance,
  projectStretchBoundaries,
  reindexStretches,
  splitStretch,
  stretchDisplayName,
  stretchDisplayNumber,
  type PathContext,
} from "./stretchEdit";

const thresholds: StretchThresholds = {
  ...DEFAULT_STRETCH_THRESHOLDS,
  climb_grade_pct: 3,
  descent_grade_pct: -3,
  min_stretch_m: 20,
};

/** Straight north path: 0 → 400 m, elevation rises then flat. */
const buildPath = (): PathContext => {
  const points = [
    { lat: 0, lon: 0, elevation_m: 100 },
    { lat: 0.001, lon: 0, elevation_m: 110 }, // ~111 m
    { lat: 0.002, lon: 0, elevation_m: 120 }, // ~222 m
    { lat: 0.003, lon: 0, elevation_m: 120 }, // ~333 m
    { lat: 0.004, lon: 0, elevation_m: 115 }, // ~444 m
  ];
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    // Use approximate 111195 m per degree lat for stable tests
    distances.push(i * 111.195);
  }
  return { points, distances };
};

const stretchAt = (
  path: PathContext,
  index: number,
  startDist: number,
  endDist: number,
  thresholdsIn: StretchThresholds = thresholds,
): Stretch => {
  const start = pointAtPathDistance(path, startDist)!;
  const end = pointAtPathDistance(path, endDist)!;
  const length_m = endDist - startDist;
  const elevation_delta_m = end.elevation_m - start.elevation_m;
  const avg_grade_pct = length_m > 0 ? (elevation_delta_m / length_m) * 100 : 0;
  const kind =
    avg_grade_pct >= thresholdsIn.climb_grade_pct
      ? "climb"
      : avg_grade_pct <= thresholdsIn.descent_grade_pct
        ? "descent"
        : "flat";
  return {
    index,
    start,
    end,
    length_m,
    elevation_delta_m,
    avg_grade_pct,
    kind,
  };
};

describe("reindexStretches", () => {
  it("assigns sequential indices from 0", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 5, 0, 100),
      stretchAt(path, 9, 100, 200),
    ];
    const result = reindexStretches(stretches);
    expect(result.map((s) => s.index)).toEqual([0, 1]);
  });
});

describe("mergeStretches", () => {
  it("merges selected with left neighbor", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 100),
      stretchAt(path, 1, 100, 200),
      stretchAt(path, 2, 200, 300),
    ];
    const result = mergeStretches(stretches, 1, "left", thresholds);
    expect(result).not.toBeNull();
    expect(result!.stretches).toHaveLength(2);
    expect(result!.selectedIndex).toBe(0);
    expect(result!.stretches[0].start).toEqual(stretches[0].start);
    expect(result!.stretches[0].end).toEqual(stretches[1].end);
    expect(result!.stretches[0].length_m).toBeCloseTo(200, 0);
    expect(result!.stretches[1].index).toBe(1);
  });

  it("merges selected with right neighbor", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 100),
      stretchAt(path, 1, 100, 200),
      stretchAt(path, 2, 200, 300),
    ];
    const result = mergeStretches(stretches, 1, "right", thresholds);
    expect(result).not.toBeNull();
    expect(result!.stretches).toHaveLength(2);
    expect(result!.selectedIndex).toBe(1);
    expect(result!.stretches[1].start).toEqual(stretches[1].start);
    expect(result!.stretches[1].end).toEqual(stretches[2].end);
  });

  it("returns null when merging past ends", () => {
    const path = buildPath();
    const stretches = [stretchAt(path, 0, 0, 100), stretchAt(path, 1, 100, 200)];
    expect(mergeStretches(stretches, 0, "left", thresholds)).toBeNull();
    expect(mergeStretches(stretches, 1, "right", thresholds)).toBeNull();
  });
});

describe("splitStretch", () => {
  it("splits at midpoint by default", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 100),
      stretchAt(path, 1, 100, 300),
      stretchAt(path, 2, 300, 400),
    ];
    const result = splitStretch(stretches, 1, path, thresholds);
    expect(result).not.toBeNull();
    expect(result!.stretches).toHaveLength(4);
    expect(result!.selectedIndex).toBe(1);
    const left = result!.stretches[1];
    const right = result!.stretches[2];
    expect(left.start).toEqual(stretches[1].start);
    expect(right.end).toEqual(stretches[1].end);
    expect(left.length_m).toBeCloseTo(100, 0);
    expect(right.length_m).toBeCloseTo(100, 0);
    expect(left.end.lat).toBeCloseTo(right.start.lat, 6);
  });

  it("splits at custom path distance within stretch", () => {
    const path = buildPath();
    const stretches = [stretchAt(path, 0, 0, 200)];
    const result = splitStretch(stretches, 0, path, thresholds, 50);
    expect(result).not.toBeNull();
    expect(result!.stretches).toHaveLength(2);
    expect(result!.stretches[0].length_m).toBeCloseTo(50, 0);
    expect(result!.stretches[1].length_m).toBeCloseTo(150, 0);
  });

  it("returns null when split would violate min length", () => {
    const path = buildPath();
    const stretches = [stretchAt(path, 0, 0, 30)];
    expect(splitStretch(stretches, 0, path, thresholds, 5)).toBeNull();
    expect(splitStretch(stretches, 0, path, thresholds, 25)).toBeNull();
  });
});

describe("moveBoundary", () => {
  it("moves shared boundary between two stretches", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 100),
      stretchAt(path, 1, 100, 250),
      stretchAt(path, 2, 250, 400),
    ];
    // boundary index 1 = between stretch 0 and 1 (end of 0)
    const result = moveBoundary(stretches, 1, 150, path, thresholds);
    expect(result).not.toBeNull();
    expect(result![0].length_m).toBeCloseTo(150, 0);
    expect(result![1].length_m).toBeCloseTo(100, 0);
    expect(result![0].end).toEqual(result![1].start);
  });

  it("clamps so neither side drops below min length", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 100),
      stretchAt(path, 1, 100, 250),
    ];
    const tooLeft = moveBoundary(stretches, 1, 5, path, thresholds);
    expect(tooLeft).not.toBeNull();
    expect(tooLeft![0].length_m).toBeGreaterThanOrEqual(thresholds.min_stretch_m - 0.5);
    expect(tooLeft![1].length_m).toBeGreaterThanOrEqual(thresholds.min_stretch_m - 0.5);

    const tooRight = moveBoundary(stretches, 1, 240, path, thresholds);
    expect(tooRight).not.toBeNull();
    expect(tooRight![0].length_m).toBeGreaterThanOrEqual(thresholds.min_stretch_m - 0.5);
    expect(tooRight![1].length_m).toBeGreaterThanOrEqual(thresholds.min_stretch_m - 0.5);
  });
});

describe("projectStretchBoundaries", () => {
  it("returns path distances for stretch endpoints", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 111.195),
      stretchAt(path, 1, 111.195, 222.39),
    ];
    const bounds = projectStretchBoundaries(stretches, path);
    expect(bounds).toHaveLength(3);
    expect(bounds[0]).toBeCloseTo(0, 0);
    expect(bounds[1]).toBeCloseTo(111.195, 0);
    expect(bounds[2]).toBeCloseTo(222.39, 0);
  });
});

describe("stretchDisplayNumber / stretchDisplayName", () => {
  it("uses 1-based numbers and custom names", () => {
    expect(stretchDisplayNumber(0)).toBe(1);
    expect(stretchDisplayNumber(2)).toBe(3);
    const path = buildPath();
    const s = stretchAt(path, 0, 0, 100);
    expect(stretchDisplayName(s)).toMatch(/1$/);
    expect(stretchDisplayName({ ...s, name: "  Summit  " })).toBe("Summit");
  });
});

describe("findShortStretchNudges", () => {
  it("flags stretches at min length that can merge", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 50),
      stretchAt(path, 1, 50, 200),
      stretchAt(path, 2, 200, 250),
    ];
    // force lengths for the check
    stretches[0] = { ...stretches[0], length_m: 50 };
    stretches[2] = { ...stretches[2], length_m: 49 };

    const nudges = findShortStretchNudges(stretches, 50);
    expect(nudges.map((n) => n.index)).toEqual([0, 2]);
    expect(nudges[0].canMergeLeft).toBe(false);
    expect(nudges[0].canMergeRight).toBe(true);
    expect(nudges[1].canMergeLeft).toBe(true);
    expect(nudges[1].canMergeRight).toBe(false);
  });

  it("restricts to candidate indices", () => {
    const path = buildPath();
    const stretches = [
      stretchAt(path, 0, 0, 50),
      stretchAt(path, 1, 50, 100),
    ];
    stretches[0] = { ...stretches[0], length_m: 40 };
    stretches[1] = { ...stretches[1], length_m: 40 };
    const nudges = findShortStretchNudges(stretches, 50, [1]);
    expect(nudges).toHaveLength(1);
    expect(nudges[0].index).toBe(1);
  });
});
