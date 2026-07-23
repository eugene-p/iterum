import { describe, expect, it } from "vitest";
import type { SegmentPass, Stretch, TrackPoint } from "../../../types";
import { assignStretchProgressColors } from "./stretchProgressRows";
import type { PositionPassRow } from "../components/positionCompareTypes";

const point = (lat: number, lon: number, timestamp?: string): TrackPoint => ({
  lat,
  lon,
  timestamp,
});

const pass = (id: number, activityId: number, name: string): SegmentPass => ({
  id,
  activity_id: activityId,
  activity_name: name,
  pass_number: 1,
  match_score: 1,
  matched: true,
  start_index: 0,
  end_index: 3,
  duration_sec: 120,
});

const stretches: Stretch[] = [
  {
    index: 1,
    start: { lat: 0, lon: 0, elevation_m: 100 },
    end: { lat: 0, lon: 0.001, elevation_m: 110 },
    length_m: 100,
    kind: "climb",
    elevation_delta_m: 10,
    avg_grade_pct: 10,
  },
  {
    index: 2,
    start: { lat: 0, lon: 0.002, elevation_m: 110 },
    end: { lat: 0, lon: 0.003, elevation_m: 110 },
    length_m: 100,
    kind: "flat",
    elevation_delta_m: 0,
    avg_grade_pct: 0,
  },
];

const row = (
  id: number,
  activityId: number,
  name: string,
  index: number,
  points: TrackPoint[],
): PositionPassRow => ({
  slice: {
    pass: pass(id, activityId, name),
    points,
    durationSec: 120,
  },
  index,
  color: "#fff",
  stretchContext: { stretch: null, stretchElapsedSec: null, stretchDistanceM: null },
});

describe("assignStretchProgressColors", () => {
  it("colors furthest stretch ahead green and earlier stretch yellow in time mode", () => {
    const points = [
      point(0, 0, "2024-01-01T10:00:00.000Z"),
      point(0, 0.001, "2024-01-01T10:01:00.000Z"),
      point(0, 0.002, "2024-01-01T10:02:00.000Z"),
      point(0, 0.003, "2024-01-01T10:03:00.000Z"),
    ];
    const rows = assignStretchProgressColors(
      [
        row(1, 10, "Leader", 3, points),
        row(2, 20, "Behind", 1, points),
      ],
      stretches,
      "time",
    );

    expect(rows[0].positionColor).toBe("#7dffb0");
    expect(rows[1].positionColor).toBe("#f5c542");
  });

  it("colors fastest arrival green in position mode", () => {
    const fastPoints = [
      point(0, 0, "2024-01-01T10:00:00.000Z"),
      point(0, 0.001, "2024-01-01T10:00:30.000Z"),
      point(0, 0.002, "2024-01-01T10:01:00.000Z"),
      point(0, 0.003, "2024-01-01T10:01:30.000Z"),
    ];
    const slowPoints = [
      point(0, 0, "2024-01-01T10:00:00.000Z"),
      point(0, 0.001, "2024-01-01T10:01:00.000Z"),
      point(0, 0.002, "2024-01-01T10:02:00.000Z"),
      point(0, 0.003, "2024-01-01T10:03:00.000Z"),
    ];
    const rows = assignStretchProgressColors(
      [
        row(1, 10, "Fast", 3, fastPoints),
        row(2, 20, "Slow", 3, slowPoints),
      ],
      stretches,
      "position",
    );

    expect(rows[0].positionColor).toBe("#7dffb0");
    expect(rows[1].positionColor).toBe("#f5c542");
  });
});