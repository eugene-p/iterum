import { describe, expect, it } from "vitest";
import { computeRoutePreviewBounds, expandRoutePreviewBounds } from "@/services/routePreview/bounds.js";

describe("route preview bounds", () => {
  it("computes bounds from points", () => {
    const bounds = computeRoutePreviewBounds([
      { lat: 48, lon: 16 },
      { lat: 48.1, lon: 16.2 },
    ]);
    expect(bounds).toEqual({
      minLat: 48,
      maxLat: 48.1,
      minLon: 16,
      maxLon: 16.2,
    });
  });

  it("expands bounds with padding", () => {
    const expanded = expandRoutePreviewBounds({
      minLat: 0,
      maxLat: 10,
      minLon: 0,
      maxLon: 10,
    });
    expect(expanded.minLat).toBeCloseTo(-1.2, 9);
    expect(expanded.maxLat).toBeCloseTo(11.2, 9);
    expect(expanded.minLon).toBeCloseTo(-1.2, 9);
    expect(expanded.maxLon).toBeCloseTo(11.2, 9);
  });
});
