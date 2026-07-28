import { describe, expect, it } from "vitest";
import { BadRequestError } from "@/middleware/errors.js";
import { resolveSegmentIndices } from "@/geo/segmentIndices.js";

const route = [
  { lat: 48.0, lon: 16.0 },
  { lat: 48.001, lon: 16.0 },
  { lat: 48.002, lon: 16.0 },
  { lat: 48.003, lon: 16.0 },
];

/**
 * Out-and-back with slight GPS drift on the return mid-point so a naive
 * nearest-point start snaps to the return visit (index 4), not outbound (2).
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

describe("resolveSegmentIndices", () => {
  it("picks start and a later end along the route", () => {
    expect(
      resolveSegmentIndices(route, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.003, lon: 16.0 },
      }),
    ).toEqual({ start_index: 0, end_index: 3 });
  });

  it("on out-and-back routes prefers activity order start < end over nearest-only snap", () => {
    expect(
      resolveSegmentIndices(outAndBack, {
        start: { lat: 48.00205, lon: 16.0 },
        end: { lat: 48.003, lon: 16.0 },
      }),
    ).toEqual({ start_index: 2, end_index: 3 });
  });

  it("resolves a descent leg after the turnaround on out-and-back", () => {
    expect(
      resolveSegmentIndices(outAndBack, {
        start: { lat: 48.003, lon: 16.0 },
        end: { lat: 48.001, lon: 16.0 },
      }),
    ).toEqual({ start_index: 3, end_index: 5 });
  });

  it("rejects when no ordered pair can be formed", () => {
    expect(() =>
      resolveSegmentIndices(
        [
          { lat: 48.0, lon: 16.0 },
          { lat: 48.001, lon: 16.0 },
        ],
        {
          start: { lat: 48.001, lon: 16.0 },
          end: { lat: 48.0, lon: 16.0 },
        },
      ),
    ).toThrow(BadRequestError);
  });

  it("when start and end are the same place, closes one lap after path leave", () => {
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
    expect(
      resolveSegmentIndices(twoLaps, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 30,
      }),
    ).toEqual({ start_index: 0, end_index: 4 });
  });

  it("same-point resolve skips dense GPS via path leave, then finds return", () => {
    const denseStartLap = [
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
    expect(
      resolveSegmentIndices(denseStartLap, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 30,
      }),
    ).toEqual({ start_index: 0, end_index: 6 });
  });

  it("same-point resolve accepts a drifted return within match radius", () => {
    const driftedReturn = [
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
      resolveSegmentIndices(driftedReturn, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 50,
      }),
    ).toEqual({ start_index: 0, end_index: 4 });
  });

  it("same-point resolve errors when return is outside match radius", () => {
    const driftedReturn = [
      { lat: 48.0, lon: 16.0 },
      { lat: 48.0, lon: 16.001 },
      { lat: 48.001, lon: 16.001 },
      { lat: 48.001, lon: 16.0 },
      { lat: 48.0003, lon: 16.0 },
      { lat: 48.0004, lon: 16.0 },
      { lat: 48.0005, lon: 16.0 },
      { lat: 48.0006, lon: 16.0 },
    ];
    expect(() =>
      resolveSegmentIndices(driftedReturn, {
        start: { lat: 48.0, lon: 16.0 },
        end: { lat: 48.0, lon: 16.0 },
        match_radius_m: 20,
      }),
    ).toThrow(BadRequestError);
  });
});
