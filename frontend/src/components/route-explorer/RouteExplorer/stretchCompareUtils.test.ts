import { describe, expect, it } from "vitest";
import type { Stretch, TrackPoint } from "../../../types";
import {
  indexAtStretchElapsedSec,
  maxStretchDurationSec,
  slicePointsForStretch,
  stretchDurationOnPass,
  stretchDurationsSec,
  stretchPositionToVirtual,
  virtualAtStretchStart,
  virtualMaxSec,
  virtualToStretchPosition,
} from "./stretchCompareUtils";

const ts = (sec: number) => `2025-01-01T00:00:${String(sec).padStart(2, "0")}.000Z`;

const point = (lon: number, sec: number): TrackPoint => ({
  lat: 0,
  lon,
  elevation_m: 100,
  timestamp: ts(sec),
});

/** Points 0..4 at 0s,10s,20s,30s,40s along lon. */
const points: TrackPoint[] = [
  point(0, 0),
  point(0.001, 10),
  point(0.002, 20),
  point(0.003, 30),
  point(0.004, 40),
];

const stretch = (index: number, startLon: number, endLon: number): Stretch => ({
  index,
  kind: "flat",
  start: { lat: 0, lon: startLon, elevation_m: 100 },
  end: { lat: 0, lon: endLon, elevation_m: 100 },
  length_m: 100,
  elevation_delta_m: 0,
  avg_grade_pct: 0,
});

describe("stretchCompareUtils", () => {
  const s0 = stretch(0, 0, 0.002); // indices ~0..2 → 20s
  const s1 = stretch(1, 0.002, 0.004); // indices ~2..4 → 20s

  describe("stretchDurationOnPass", () => {
    it("returns elapsed span of the stretch on the pass", () => {
      expect(stretchDurationOnPass(points, s0)).toBe(20);
      expect(stretchDurationOnPass(points, s1)).toBe(20);
    });
  });

  describe("maxStretchDurationSec / durations / virtualMax", () => {
    it("takes the max across passes", () => {
      const slices = [
        { pass: { id: 1 } as never, points, durationSec: 40 },
        {
          pass: { id: 2 } as never,
          points: [point(0, 0), point(0.002, 30), point(0.004, 60)],
          durationSec: 60,
        },
      ];
      // second pass: s0 from 0 to 0.002 → 30s
      expect(maxStretchDurationSec(slices, s0)).toBe(30);
      expect(stretchDurationsSec(slices, [s0, s1])[0]).toBe(30);
      expect(virtualMaxSec([30, 20])).toBe(50);
    });
  });

  describe("virtualToStretchPosition / stretchPositionToVirtual", () => {
    const durations = [20, 20, 10];

    it("maps start and interior of first stretch", () => {
      expect(virtualToStretchPosition(0, durations)).toEqual({
        stretchIndex: 0,
        localElapsedSec: 0,
      });
      expect(virtualToStretchPosition(10, durations)).toEqual({
        stretchIndex: 0,
        localElapsedSec: 10,
      });
    });

    it("maps exact boundary to start of next stretch", () => {
      expect(virtualToStretchPosition(20, durations)).toEqual({
        stretchIndex: 1,
        localElapsedSec: 0,
      });
    });

    it("maps just past boundary into next stretch", () => {
      expect(virtualToStretchPosition(20.5, durations)).toEqual({
        stretchIndex: 1,
        localElapsedSec: 0.5,
      });
    });

    it("maps reverse from second stretch start into previous stretch near end", () => {
      expect(virtualToStretchPosition(19.5, durations)).toEqual({
        stretchIndex: 0,
        localElapsedSec: 19.5,
      });
      // V = 40 is boundary start of stretch 2 (half-open)
      expect(virtualToStretchPosition(40, durations)).toEqual({
        stretchIndex: 2,
        localElapsedSec: 0,
      });
      // near end of stretch 1
      expect(virtualToStretchPosition(39.5, durations)).toEqual({
        stretchIndex: 1,
        localElapsedSec: 19.5,
      });
    });

    it("clamps to last stretch end", () => {
      expect(virtualToStretchPosition(999, durations)).toEqual({
        stretchIndex: 2,
        localElapsedSec: 10,
      });
    });

    it("round-trips stretch position to virtual", () => {
      expect(stretchPositionToVirtual(1, 5, durations)).toBe(25);
      expect(virtualAtStretchStart(1, durations)).toBe(20);
      expect(virtualAtStretchStart(0, durations)).toBe(0);
    });
  });

  describe("indexAtStretchElapsedSec", () => {
    it("returns start at t=0 and end at full duration", () => {
      expect(indexAtStretchElapsedSec(points, s0, 0)).toBe(0);
      expect(indexAtStretchElapsedSec(points, s0, 20)).toBe(2);
      expect(indexAtStretchElapsedSec(points, s0, 100)).toBe(2);
    });

    it("moves within stretch", () => {
      expect(indexAtStretchElapsedSec(points, s0, 10)).toBe(1);
    });
  });

  describe("slicePointsForStretch", () => {
    it("returns points from stretch start through end inclusive", () => {
      const sliced = slicePointsForStretch(points, s0);
      expect(sliced).toHaveLength(3);
      expect(sliced[0].lon).toBe(0);
      expect(sliced[2].lon).toBe(0.002);
    });
  });
});
