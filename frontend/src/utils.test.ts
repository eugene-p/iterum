import { describe, expect, it } from "vitest";
import { resolveLoopTrackIndices, resolveOrderedTrackIndices } from "./utils";

/**
 * Out-and-back with GPS drift on the return mid-point so nearest-only start
 * snaps to index 4 instead of outbound index 2.
 */
const outAndBack = [
  { lat: 48.0, lon: 16.0 },
  { lat: 48.001, lon: 16.0 },
  { lat: 48.002, lon: 16.0 },
  { lat: 48.003, lon: 16.0 },
  { lat: 48.00205, lon: 16.0 },
  { lat: 48.001, lon: 16.0 },
  { lat: 48.0, lon: 16.0 },
];

describe("resolveOrderedTrackIndices", () => {
  it("picks start and a later end along a simple route", () => {
    expect(
      resolveOrderedTrackIndices(outAndBack.slice(0, 4), {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.003, lon: 16.0 },
      }),
    ).toEqual({ start_index: 0, end_index: 3 });
  });

  it("on out-and-back routes keeps activity order start < end", () => {
    expect(
      resolveOrderedTrackIndices(outAndBack, {
        start: { lat: 48.00205, lon: 16.0 },
        end: { lat: 48.003, lon: 16.0 },
      }),
    ).toEqual({ start_index: 2, end_index: 3 });
  });

  it("resolves a return-leg segment after the turnaround", () => {
    expect(
      resolveOrderedTrackIndices(outAndBack, {
        start: { lat: 48.003, lon: 16.0 },
        end: { lat: 48.001, lon: 16.0 },
      }),
    ).toEqual({ start_index: 3, end_index: 5 });
  });

  it("returns null when end cannot be ordered after start", () => {
    expect(
      resolveOrderedTrackIndices(
        [
          { lat: 48.0, lon: 16.0 },
          { lat: 48.001, lon: 16.0 },
        ],
        {
          start: { lat: 48.001, lon: 16.0 },
          end: { lat: 48.0, lon: 16.0 },
        },
      ),
    ).toBeNull();
  });

  it("does not collapse two nearby clicks into a ~10 m path slice", () => {
    // Dense samples ~5.5 m apart; clicks near the same place would otherwise
    // pick adjacent indices. Require ≥ 40 m of path between start and end.
    const dense: Array<{ lat: number; lon: number }> = [];
    for (let i = 0; i < 20; i++) {
      dense.push({ lat: 48.0 + i * 0.00005, lon: 16.0 });
    }
    const resolved = resolveOrderedTrackIndices(dense, {
      start: { lat: 48.0, lon: 16.0 },
      end: { lat: 48.0001, lon: 16.0 },
    });
    expect(resolved).not.toBeNull();
    expect(resolved!.end_index - resolved!.start_index).toBeGreaterThan(5);
    // Rough path length check: ~5.5 m per step * steps ≥ 40 m.
    expect(resolved!.end_index - resolved!.start_index).toBeGreaterThanOrEqual(7);
  });
});

/** Two laps; ~111 m between adjacent points — leave gate clears on first step. */
const twoLaps = [
  { lat: 48.0, lon: 16.0 },
  { lat: 48.0, lon: 16.001 },
  { lat: 48.001, lon: 16.001 },
  { lat: 48.001, lon: 16.0 },
  { lat: 48.0, lon: 16.0 },
  { lat: 48.0, lon: 16.001 },
  { lat: 48.001, lon: 16.001 },
  { lat: 48.001, lon: 16.0 },
  { lat: 48.0, lon: 16.0 },
];

/** Dense points near start then a full lap; path leave must skip the dense cluster. */
const lapWithDenseStart = [
  { lat: 48.0, lon: 16.0 },
  { lat: 48.0, lon: 16.00002 },
  { lat: 48.0, lon: 16.00004 },
  { lat: 48.0, lon: 16.001 },
  { lat: 48.001, lon: 16.001 },
  { lat: 48.001, lon: 16.0 },
  { lat: 48.0, lon: 16.0 },
  { lat: 48.0, lon: 16.001 },
  { lat: 48.001, lon: 16.001 },
  { lat: 48.001, lon: 16.0 },
];

describe("resolveLoopTrackIndices", () => {
  it("closes one lap at the next return to the start/finish", () => {
    expect(
      resolveLoopTrackIndices(twoLaps, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 30,
      }),
    ).toEqual({ start_index: 0, end_index: 4 });
  });

  it("skips dense GPS near start via path-distance leave, then finds the return", () => {
    expect(
      resolveLoopTrackIndices(lapWithDenseStart, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 30,
      }),
    ).toEqual({ start_index: 0, end_index: 6 });
  });

  it("returns null when the track never returns within match radius", () => {
    expect(
      resolveLoopTrackIndices(
        [
          { lat: 48.0, lon: 16.0 },
          { lat: 48.001, lon: 16.0 },
          { lat: 48.002, lon: 16.0 },
          { lat: 48.003, lon: 16.0 },
          { lat: 48.004, lon: 16.0 },
        ],
        {
          start: { lat: 48.0, lon: 16.0 },
          end: { lat: 48.0, lon: 16.0 },
          match_radius_m: 30,
        },
      ),
    ).toBeNull();
  });

  it("accepts a return with GPS drift when within match radius", () => {
    // ~33 m north of start — needs radius ≥ 33.
    const lapWithDriftedReturn = [
      { lat: 48.0, lon: 16.0 },
      { lat: 48.0, lon: 16.001 },
      { lat: 48.001, lon: 16.001 },
      { lat: 48.001, lon: 16.0 },
      { lat: 48.0003, lon: 16.0 },
      { lat: 48.0004, lon: 16.0 },
      { lat: 48.0005, lon: 16.0 },
      { lat: 48.0006, lon: 16.0 },
    ];
    expect(
      resolveLoopTrackIndices(lapWithDriftedReturn, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 50,
      }),
    ).toEqual({ start_index: 0, end_index: 4 });
  });

  it("rejects a return outside the match radius", () => {
    const lapWithDriftedReturn = [
      { lat: 48.0, lon: 16.0 },
      { lat: 48.0, lon: 16.001 },
      { lat: 48.001, lon: 16.001 },
      { lat: 48.001, lon: 16.0 },
      { lat: 48.0003, lon: 16.0 },
      { lat: 48.0004, lon: 16.0 },
      { lat: 48.0005, lon: 16.0 },
      { lat: 48.0006, lon: 16.0 },
    ];
    expect(
      resolveLoopTrackIndices(lapWithDriftedReturn, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 20,
      }),
    ).toBeNull();
  });

  it("does not treat the ~40 m leave stub as a finished loop", () => {
    // Path goes out just past the leave gate then wiggles — not a real return from afar.
    const shortStub = [
      { lat: 48.0, lon: 16.0 },
      { lat: 48.0002, lon: 16.0 },
      { lat: 48.0004, lon: 16.0 },
      { lat: 48.00035, lon: 16.0 },
      { lat: 48.00036, lon: 16.0 },
      { lat: 48.00037, lon: 16.0 },
      { lat: 48.00038, lon: 16.0 },
    ];
    expect(
      resolveLoopTrackIndices(shortStub, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 50,
      }),
    ).toBeNull();
  });

  it("takes the first valid return, not a later closer finish", () => {
    const twoLapsCloserSecond = [
      { lat: 48.0, lon: 16.0 },
      { lat: 48.0, lon: 16.001 },
      { lat: 48.001, lon: 16.001 },
      { lat: 48.001, lon: 16.0 },
      { lat: 48.0002, lon: 16.0 },
      { lat: 48.0003, lon: 16.0 },
      { lat: 48.0004, lon: 16.0 },
      { lat: 48.0005, lon: 16.0 },
      { lat: 48.0, lon: 16.001 },
      { lat: 48.001, lon: 16.001 },
      { lat: 48.001, lon: 16.0 },
      { lat: 48.0, lon: 16.0 },
      { lat: 48.0, lon: 16.0001 },
      { lat: 48.0, lon: 16.0002 },
      { lat: 48.0, lon: 16.0003 },
    ];
    expect(
      resolveLoopTrackIndices(twoLapsCloserSecond, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 30,
      }),
    ).toEqual({ start_index: 0, end_index: 4 });
  });

  it("refines the return between closest and next when the finish sits nearer the next sample", () => {
    // Valley dips at index 4, then rises for 3 steps — but index 5 is slightly closer
    // to the finish click; split-the-difference should prefer 5 when projection is past mid-edge.
    const lap = [
      { lat: 48.0, lon: 16.0 },
      { lat: 48.0, lon: 16.001 },
      { lat: 48.001, lon: 16.001 },
      { lat: 48.001, lon: 16.0 },
      { lat: 48.00025, lon: 16.0 },
      { lat: 48.00005, lon: 16.0 },
      { lat: 48.00015, lon: 16.0 },
      { lat: 48.00025, lon: 16.0 },
      { lat: 48.00035, lon: 16.0 },
    ];
    const resolved = resolveLoopTrackIndices(lap, {
      start: { lat: 48.0, lon: 16.0 },
      end: { lat: 48.0, lon: 16.0 },
      match_radius_m: 50,
    });
    expect(resolved).not.toBeNull();
    expect(resolved!.start_index).toBe(0);
    // Closest sample to (48,16) on the return is index 5 (~5.5 m), not 4 (~28 m).
    expect(resolved!.end_index).toBe(5);
  });
});
