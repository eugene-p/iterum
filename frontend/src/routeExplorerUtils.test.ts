import { describe, expect, it } from "vitest";
import type { TrackPoint } from "./types";
import {
  formatDistanceShort,
  indexAtElapsedSec,
  indexAtRelativePosition,
  sliceDurationSec,
  timeSliderStep,
} from "./routeExplorerUtils";

const point = (timestamp: string, lat = 0, lon = 0): TrackPoint => ({
  lat,
  lon,
  timestamp,
});

describe("routeExplorerUtils", () => {
  describe("sliceDurationSec", () => {
    it("returns elapsed seconds between first and last timestamps", () => {
      const points = [
        point("2024-01-01T10:00:00.000Z"),
        point("2024-01-01T10:01:30.000Z"),
      ];
      expect(sliceDurationSec(points)).toBe(90);
    });

    it("returns null when timestamps are missing", () => {
      expect(sliceDurationSec([point("")])).toBeNull();
    });
  });

  describe("indexAtElapsedSec", () => {
    const points = [
      point("2024-01-01T10:00:00.000Z", 0, 0),
      point("2024-01-01T10:01:00.000Z", 0, 0.01),
      point("2024-01-01T10:02:00.000Z", 0, 0.02),
    ];

    it("maps elapsed time to the nearest point index", () => {
      expect(indexAtElapsedSec(points, 0)).toBe(0);
      expect(indexAtElapsedSec(points, 75)).toBe(1);
      expect(indexAtElapsedSec(points, 120)).toBe(2);
    });
  });

  describe("indexAtRelativePosition", () => {
    const points = [point("t0"), point("t1"), point("t2"), point("t3")];

    it("clamps fraction and rounds to an index", () => {
      expect(indexAtRelativePosition(points, 0)).toBe(0);
      expect(indexAtRelativePosition(points, 1)).toBe(3);
      expect(indexAtRelativePosition(points, 0.5)).toBe(2);
      expect(indexAtRelativePosition(points, -1)).toBe(0);
    });
  });

  describe("timeSliderStep", () => {
    it("returns 1 for non-positive durations", () => {
      expect(timeSliderStep(0)).toBe(1);
    });

    it("scales step size with duration", () => {
      expect(timeSliderStep(400)).toBe(2);
      expect(timeSliderStep(1000)).toBe(5);
    });
  });

  describe("formatDistanceShort", () => {
    it("formats meters and kilometers", () => {
      expect(formatDistanceShort(250)).toBe("250 m");
      expect(formatDistanceShort(1500)).toBe("1.50 km");
    });
  });
});