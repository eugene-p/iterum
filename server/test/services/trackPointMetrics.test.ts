import { describe, expect, it } from "vitest";
import { enrichTrackPointMetrics } from "@/services/trackPointMetrics.js";

describe("enrichTrackPointMetrics", () => {
  const t0 = new Date("2024-01-01T10:00:00.000Z");
  const t1 = new Date("2024-01-01T10:00:01.000Z");
  const t2 = new Date("2024-01-01T10:00:03.000Z");

  it("derives distance and speed from timestamps", () => {
    const enriched = enrichTrackPointMetrics([
      { lat: 48.0, lon: -123.0, timestamp: t0, speedMps: null, distanceM: null },
      { lat: 48.00001, lon: -123.0, timestamp: t1, speedMps: null, distanceM: null },
      { lat: 48.00002, lon: -123.0, timestamp: t2, speedMps: null, distanceM: null },
    ]);

    expect(enriched[0].distanceM).toBe(0);
    expect(enriched[0].speedMps).toBeNull();
    expect(enriched[2].distanceM ?? 0).toBeGreaterThan(enriched[1].distanceM ?? 0);
    expect(enriched[1].speedMps).toBeCloseTo(enriched[1].distanceM! / 1, 0);
    expect(enriched[2].speedMps).toBeCloseTo(
      ((enriched[2].distanceM ?? 0) - (enriched[1].distanceM ?? 0)) / 2,
      0,
    );
  });

  it("preserves file distance and derives speed from it", () => {
    const withFileDistance = enrichTrackPointMetrics([
      { lat: 48.0, lon: -123.0, timestamp: t0, distanceM: 0, speedMps: null },
      { lat: 48.00001, lon: -123.0, timestamp: t1, distanceM: 100, speedMps: null },
    ]);
    expect(withFileDistance[1].distanceM).toBe(100);
    expect(withFileDistance[1].speedMps).toBeCloseTo(100, 0);
  });

  it("preserves file speed", () => {
    const withFileSpeed = enrichTrackPointMetrics([
      { lat: 48.0, lon: -123.0, timestamp: t0, distanceM: null, speedMps: 3.5 },
      { lat: 48.00001, lon: -123.0, timestamp: t1, distanceM: null, speedMps: null },
    ]);
    expect(withFileSpeed[0].speedMps).toBe(3.5);
  });

  it("skips speed when delta time is zero", () => {
    const duplicateTimestamp = enrichTrackPointMetrics([
      { lat: 48.0, lon: -123.0, timestamp: t0, distanceM: null, speedMps: null },
      { lat: 48.00001, lon: -123.0, timestamp: t0, distanceM: null, speedMps: null },
    ]);
    expect(duplicateTimestamp[1].speedMps).toBeNull();
  });
});
