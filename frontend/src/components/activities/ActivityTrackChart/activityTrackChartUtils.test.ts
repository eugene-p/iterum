import { describe, expect, it } from "vitest";
import type { TrackPoint } from "../../../types";
import {
  buildActivityTrackSeries,
  computeElevationGridLines,
  sampleAtFraction,
  seriesToSvgPaths,
} from "./activityTrackChartUtils";

const point = (hr: number | null, elev: number | null): TrackPoint => ({
  lat: 0,
  lon: 0,
  heart_rate: hr,
  elevation_m: elev,
});

describe("buildActivityTrackSeries", () => {
  it("returns null when no heart rate data", () => {
    expect(buildActivityTrackSeries([point(null, 100), point(null, 110)])).toBeNull();
  });

  it("builds series with elevation fill data", () => {
    const series = buildActivityTrackSeries([
      point(120, 100),
      point(130, 120),
      point(140, 110),
    ]);
    expect(series?.hasElevation).toBe(true);
    expect(series?.hrMin).toBe(120);
    expect(series?.hrMax).toBe(140);
  });
});

describe("computeElevationGridLines", () => {
  it("returns interior elevation ticks between min and max", () => {
    const lines = computeElevationGridLines(118, 168);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((elev) => elev > 118 && elev < 168)).toBe(true);
  });
});

describe("sampleAtFraction", () => {
  it("returns the sample nearest the requested fraction", () => {
    const series = buildActivityTrackSeries([
      point(120, 100),
      point(130, 110),
      point(140, 120),
    ]);
    expect(series).not.toBeNull();
    expect(sampleAtFraction(series!, 0).hr).toBe(120);
    expect(sampleAtFraction(series!, 1).hr).toBe(140);
    expect(sampleAtFraction(series!, 0.5).hr).toBe(130);
  });
});

describe("seriesToSvgPaths", () => {
  it("produces hr line and elevation area paths", () => {
    const series = buildActivityTrackSeries([
      point(120, 100),
      point(130, 120),
      point(140, 110),
    ]);
    expect(series).not.toBeNull();
    const paths = seriesToSvgPaths(series!);
    expect(paths.hrLine).toMatch(/^M /);
    expect(paths.elevationArea).toContain("Z");
  });
});