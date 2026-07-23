import { describe, expect, it } from "vitest";
import { BadRequestError } from "@/middleware/errors.js";
import { resolveSegmentIndices } from "@/geo/segmentIndices.js";

const route = [
  { lat: 48.0, lon: 16.0 },
  { lat: 48.001, lon: 16.0 },
  { lat: 48.002, lon: 16.0 },
  { lat: 48.003, lon: 16.0 },
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

  it("rejects an end that is not ahead of the start", () => {
    expect(() =>
      resolveSegmentIndices(
        [
          { lat: 48.0, lon: 16.0 },
          { lat: 48.001, lon: 16.0 },
        ],
        {
          start: { lat: 48.001, lon: 16.0 },
          end: { lat: 48.001, lon: 16.0 },
        },
      ),
    ).toThrow(BadRequestError);
  });
});