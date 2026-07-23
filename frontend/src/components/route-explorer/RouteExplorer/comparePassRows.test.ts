import { describe, expect, it } from "vitest";
import type { SegmentPass, Stretch, TrackPoint } from "../../../types";
import {
  buildSegmentTimePassRows,
  buildStretchTimePassRows,
  markersFromPassRows,
  soloActivityMarker,
} from "./comparePassRows";

const ts = (sec: number) =>
  `2025-01-01T00:${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}.000Z`;

const point = (lon: number, sec: number, hr?: number): TrackPoint => ({
  lat: 0,
  lon,
  elevation_m: 100,
  timestamp: ts(sec),
  heart_rate: hr,
});

const points: TrackPoint[] = [
  point(0, 0, 120),
  point(0.001, 10, 125),
  point(0.002, 20, 130),
  point(0.003, 30, 135),
  point(0.004, 40, 140),
];

const makePass = (id: number, name: string): SegmentPass => ({
  id,
  activity_id: id * 10,
  activity_name: name,
  pass_number: 1,
  match_score: 1,
  matched: true,
  duration_sec: 40,
});

const stretch = (index: number, startLon: number, endLon: number): Stretch => ({
  index,
  kind: "flat",
  start: { lat: 0, lon: startLon, elevation_m: 100 },
  end: { lat: 0, lon: endLon, elevation_m: 100 },
  length_m: 100,
  elevation_delta_m: 0,
  avg_grade_pct: 0,
});

const s0 = stretch(0, 0, 0.002);
const s1 = stretch(1, 0.002, 0.004);

describe("comparePassRows", () => {
  const passA = makePass(1, "A");
  const passB = makePass(2, "B");
  const slices = [
    { pass: passA, points, durationSec: 40 as number | null },
    { pass: passB, points, durationSec: 40 as number | null },
  ];
  const matched = [passA, passB];

  describe("buildSegmentTimePassRows", () => {
    it("samples each pass at segment elapsed time from start", () => {
      const rows = buildSegmentTimePassRows(slices, 20, [s0, s1], matched);
      expect(rows).toHaveLength(2);
      expect(rows[0].index).toBe(2);
      expect(rows[1].index).toBe(2);
      expect(rows[0].color).toBeTruthy();
      expect(rows[0].color).not.toBe(rows[1].color);
    });

    it("attaches stretch context for the stretch containing the sample", () => {
      const rows = buildSegmentTimePassRows(slices, 10, [s0, s1], matched);
      expect(rows[0].stretchContext.stretch?.index).toBe(0);
      expect(rows[0].stretchContext.stretchElapsedSec).toBe(10);
    });

    it("returns empty for no slices", () => {
      expect(buildSegmentTimePassRows([], 10, [s0], matched)).toEqual([]);
    });
  });

  describe("buildStretchTimePassRows", () => {
    it("samples within the stretch at local elapsed and forces that stretch context", () => {
      const rows = buildStretchTimePassRows(slices, s1, 10, matched);
      expect(rows).toHaveLength(2);
      // s1 covers indices ~2..4; 10s into stretch → index 3
      expect(rows[0].index).toBe(3);
      expect(rows[0].stretchContext.stretch?.index).toBe(1);
      expect(rows[0].stretchContext.stretchElapsedSec).toBe(10);
    });

    it("clamps at stretch end when local time exceeds stretch duration", () => {
      const rows = buildStretchTimePassRows(slices, s0, 999, matched);
      expect(rows[0].index).toBe(2);
      expect(rows[0].stretchContext.stretch?.index).toBe(0);
    });

    it("starts at stretch start when local elapsed is 0", () => {
      const rows = buildStretchTimePassRows(slices, s1, 0, matched);
      expect(rows[0].index).toBe(2);
      expect(rows[0].stretchContext.stretchElapsedSec).toBe(0);
    });
  });

  describe("markersFromPassRows", () => {
    it("builds one map marker per row with pass id prefix", () => {
      const rows = buildStretchTimePassRows(slices, s0, 0, matched);
      const markers = markersFromPassRows(rows, "stretch");
      expect(markers).toHaveLength(2);
      expect(markers[0].id).toBe("stretch-1");
      expect(markers[1].id).toBe("stretch-2");
      expect(markers[0].point.lon).toBe(0);
      expect(markers[0].color).toBe(rows[0].color);
    });
  });

  describe("soloActivityMarker", () => {
    it("returns a single marker at the index", () => {
      const markers = soloActivityMarker(points, 2, 40, "#abc");
      expect(markers).toHaveLength(1);
      expect(markers[0]).toMatchObject({
        id: "current",
        color: "#abc",
        point: expect.objectContaining({ lon: 0.002 }),
      });
    });

    it("returns empty when index is out of range", () => {
      expect(soloActivityMarker(points, 99, 40, "#abc")).toEqual([]);
      expect(soloActivityMarker([], 0, null, "#abc")).toEqual([]);
    });
  });
});
