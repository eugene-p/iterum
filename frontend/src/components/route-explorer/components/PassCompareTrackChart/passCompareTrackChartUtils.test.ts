import { describe, expect, it } from "vitest";
import type { TrackPoint } from "../../../../types";
import { computeHrZoneBands } from "../../../../lib/hrZones";
import { hrToChartY } from "../../../activities/ActivityTrackChart/activityTrackChartUtils";
import type { SegmentPass, Stretch } from "../../../../types";
import {
  buildPassCompareTrackChartData,
  formatPassChartLabel,
  passChartItemsFromStretchRows,
  passCompareHrScale,
  passesHaveHeartRate,
  samplePassesAtFraction,
} from "./passCompareTrackChartUtils";
import type { PositionPassRow } from "../positionCompareTypes";

const point = (hr: number | null, elev: number | null = null): TrackPoint => ({
  lat: 0,
  lon: 0,
  heart_rate: hr,
  elevation_m: elev,
});

describe("formatPassChartLabel", () => {
  it("puts date before activity name", () => {
    const label = formatPassChartLabel({
      id: 1,
      activity_id: 1,
      activity_name: "Morning Run",
      pass_number: 1,
      match_score: 1,
      matched: true,
      started_at: "2025-06-15T10:30:00.000Z",
      created_at: "2025-06-15T10:35:00.000Z",
    });

    expect(label).toMatch(/^Jun 15/);
    expect(label).toContain("— Morning Run");
  });

  it("falls back to name when no date is available", () => {
    expect(
      formatPassChartLabel({
        id: 1,
        activity_id: 1,
        activity_name: "Untitled",
        pass_number: 1,
        match_score: 1,
        matched: true,
      }),
    ).toBe("Untitled");
  });

  it("appends pass number after the name", () => {
    const label = formatPassChartLabel({
      id: 1,
      activity_id: 1,
      activity_name: "Loop",
      pass_number: 2,
      match_score: 1,
      matched: true,
      started_at: "2025-03-01T08:00:00.000Z",
    });

    expect(label).toContain("— Loop · pass 2");
  });
});

describe("passesHaveHeartRate", () => {
  const samplePass = (hr: number | null) => ({
    label: "A",
    color: "#f97316",
    seriesIndex: 0,
    points: hr == null ? [point(null), point(null)] : [point(hr), point(hr + 10)],
  });

  it("returns false when no pass has heart rate", () => {
    expect(passesHaveHeartRate([samplePass(null)])).toBe(false);
  });

  it("returns true when any pass has heart rate", () => {
    expect(passesHaveHeartRate([samplePass(120)])).toBe(true);
  });
});

describe("buildPassCompareTrackChartData", () => {
  it("returns null when no heart rate data exists", () => {
    expect(
      buildPassCompareTrackChartData(
        [{ label: "A", color: "#fff", seriesIndex: 0, points: [point(null), point(null)] }],
        { mode: "position" },
      ),
    ).toBeNull();
  });

  it("builds one line per pass with shared scale", () => {
    const data = buildPassCompareTrackChartData(
      [
        {
          label: "Pass A",
          color: "#f97316",
          seriesIndex: 0,
          dasharray: undefined,
          points: [point(120), point(140)],
        },
        {
          label: "Pass B",
          color: "#22d3ee",
          seriesIndex: 1,
          dasharray: "7 4",
          points: [point(130), point(150)],
        },
      ],
      {
        mode: "position",
        elevationPoints: [point(null, 100), point(null, 120)],
      },
    );

    expect(data?.lines).toHaveLength(2);
    expect(data?.hrMin).toBe(120);
    expect(data?.hrMax).toBe(150);
    expect(data?.hasElevation).toBe(true);
    expect(data?.lines[0].path).toMatch(/^M /);
    expect(data?.lines[1].dasharray).toBe("7 4");
    expect(data?.lines[0].seriesIndex).toBe(0);
  });

  it("aligns elevation X with elapsed time in time mode", () => {
    const elevPoints: TrackPoint[] = [
      { lat: 0, lon: 0, elevation_m: 100, timestamp: "2025-01-01T00:00:00.000Z" },
      { lat: 0, lon: 0.001, elevation_m: 110, timestamp: "2025-01-01T00:00:30.000Z" },
      { lat: 0, lon: 0.002, elevation_m: 120, timestamp: "2025-01-01T00:01:00.000Z" },
    ];
    const data = buildPassCompareTrackChartData(
      [
        {
          label: "Pass A",
          color: "#f97316",
          seriesIndex: 0,
          points: [
            { lat: 0, lon: 0, heart_rate: 120, timestamp: "2025-01-01T00:00:00.000Z" },
            { lat: 0, lon: 0.001, heart_rate: 140, timestamp: "2025-01-01T00:01:00.000Z" },
          ],
          durationSec: 60,
        },
      ],
      {
        mode: "time",
        maxTimeSec: 60,
        elevationPoints: elevPoints,
      },
    );

    expect(data?.elevationLine).toBeTruthy();
    // Mid elevation sample at 30s of 60s → x ≈ 50
    expect(data?.elevationLine).toMatch(/L 50 /);
  });

  it("stores profile max HR for zone bands when provided", () => {
    const data = buildPassCompareTrackChartData(
      [
        {
          label: "Pass A",
          color: "#f97316",
          seriesIndex: 0,
          points: [point(100), point(165)],
        },
      ],
      { mode: "position", zoneMaxHr: 180 },
    );

    expect(data?.zoneMaxHr).toBe(180);
    const bands = computeHrZoneBands(data!.zoneMaxHr!, passCompareHrScale(data!), hrToChartY);
    expect(bands.map((band) => band.label)).toEqual(["Z1", "Z2", "Z3", "Z4", "Z5"]);
  });
});

describe("samplePassesAtFraction", () => {
  it("samples each pass at the requested position fraction", () => {
    const samples = samplePassesAtFraction(
      [
        { label: "A", color: "#f97316", seriesIndex: 0, points: [point(120), point(140)] },
        { label: "B", color: "#22d3ee", seriesIndex: 1, points: [point(130), point(150)] },
      ],
      "position",
      1,
      0,
    );

    expect(samples).toEqual([
      { label: "A", color: "#f97316", hr: 140 },
      { label: "B", color: "#22d3ee", hr: 150 },
    ]);
  });
});

describe("passChartItemsFromStretchRows", () => {
  const track: TrackPoint[] = [
    { lat: 0, lon: 0, heart_rate: 110, elevation_m: 100, timestamp: "2025-01-01T00:00:00.000Z" },
    { lat: 0, lon: 0.001, heart_rate: 120, elevation_m: 105, timestamp: "2025-01-01T00:00:10.000Z" },
    { lat: 0, lon: 0.002, heart_rate: 130, elevation_m: 110, timestamp: "2025-01-01T00:00:20.000Z" },
    { lat: 0, lon: 0.003, heart_rate: 140, elevation_m: 115, timestamp: "2025-01-01T00:00:30.000Z" },
    { lat: 0, lon: 0.004, heart_rate: 150, elevation_m: 120, timestamp: "2025-01-01T00:00:40.000Z" },
  ];

  const pass: SegmentPass = {
    id: 7,
    activity_id: 1,
    activity_name: "Climb day",
    pass_number: 1,
    match_score: 1,
    matched: true,
    duration_sec: 40,
  };

  const stretch: Stretch = {
    index: 1,
    kind: "climb",
    start: { lat: 0, lon: 0.002, elevation_m: 100 },
    end: { lat: 0, lon: 0.004, elevation_m: 120 },
    length_m: 200,
    elevation_delta_m: 20,
    avg_grade_pct: 5,
  };

  const row: PositionPassRow = {
    slice: { pass, points: track, durationSec: 40 },
    index: 3,
    color: "#f97316",
    stretchContext: { stretch, stretchElapsedSec: 10, stretchDistanceM: 50 },
  };

  it("clips pass points to the stretch window and sets stretch duration", () => {
    const items = passChartItemsFromStretchRows([row], stretch, 20, [pass]);
    expect(items).toHaveLength(1);
    expect(items[0].points).toHaveLength(3);
    expect(items[0].points[0].lon).toBe(0.002);
    expect(items[0].points[2].lon).toBe(0.004);
    expect(items[0].durationSec).toBe(20);
    expect(items[0].color).toBe("#f97316");
  });

  it("builds chart data from stretch-clipped series in time mode", () => {
    const items = passChartItemsFromStretchRows([row], stretch, 20, [pass]);
    const data = buildPassCompareTrackChartData(items, {
      mode: "time",
      maxTimeSec: 20,
      elevationPoints: items[0].points,
    });
    expect(data).not.toBeNull();
    expect(data?.lines).toHaveLength(1);
    expect(data?.hasElevation).toBe(true);
  });
});