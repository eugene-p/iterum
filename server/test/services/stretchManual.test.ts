import { describe, expect, it } from "vitest";
import { DEFAULT_STRETCH_THRESHOLDS } from "@/services/stretchSegmentation.js";
import { normalizeManualStretches } from "@/services/stretchManual.js";

describe("normalizeManualStretches", () => {
  it("reindexes and enriches kinds from grade", () => {
    const result = normalizeManualStretches(
      [
        {
          start: { lat: 0, lon: 0, elevation_m: 100 },
          end: { lat: 0.001, lon: 0, elevation_m: 120 },
          length_m: 200,
        },
        {
          start: { lat: 0.001, lon: 0, elevation_m: 120 },
          end: { lat: 0.002, lon: 0, elevation_m: 118 },
          length_m: 150,
        },
      ],
      DEFAULT_STRETCH_THRESHOLDS,
    );

    expect(result.stretches).toHaveLength(2);
    expect(result.stretches[0].index).toBe(0);
    expect(result.stretches[1].index).toBe(1);
    expect(result.stretches[0].kind).toBe("climb");
    expect(result.stretches[0].elevation_delta_m).toBe(20);
    expect(result.segment_length_m).toBe(350);
  });

  it("rejects non-positive length", () => {
    expect(() =>
      normalizeManualStretches(
        [
          {
            start: { lat: 0, lon: 0, elevation_m: 0 },
            end: { lat: 0, lon: 0, elevation_m: 0 },
            length_m: 0,
          },
        ],
        DEFAULT_STRETCH_THRESHOLDS,
      ),
    ).toThrow(/Invalid stretch/);
  });

  it("returns empty reason when no stretches", () => {
    const result = normalizeManualStretches([], DEFAULT_STRETCH_THRESHOLDS);
    expect(result.stretches).toHaveLength(0);
    expect(result.reason).toMatch(/No stretches/);
  });
});
