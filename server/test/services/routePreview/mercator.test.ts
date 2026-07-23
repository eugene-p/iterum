import { describe, expect, it } from "vitest";
import {
  chooseZoomForBounds,
  createMercatorProjector,
  latLonToWorldPixel,
  tileRangeForViewport,
} from "@/services/routePreview/mercator.js";

describe("mercator", () => {
  it("is stable for identical world pixels", () => {
    const first = latLonToWorldPixel(48.2, 16.37, 13);
    const second = latLonToWorldPixel(48.2, 16.37, 13);
    expect(first).toEqual(second);
  });

  it("chooses a zoom that fits the viewport", () => {
    const zoom = chooseZoomForBounds(
      { minLat: 48, maxLat: 48.1, minLon: 16, maxLon: 16.1 },
      380,
      260,
      18,
    );
    const northWest = latLonToWorldPixel(48.1, 16, zoom);
    const southEast = latLonToWorldPixel(48, 16.1, zoom);
    expect(southEast.x - northWest.x).toBeLessThanOrEqual(380 - 36);
    expect(southEast.y - northWest.y).toBeLessThanOrEqual(260 - 36);
  });

  it("projects the map center", () => {
    const project = createMercatorProjector({ lat: 0, lon: 0 }, 5, 100, 100);
    const center = project({ lat: 0, lon: 0 });
    expect(Math.abs(center[0] - 50)).toBeLessThan(1);
    expect(Math.abs(center[1] - 50)).toBeLessThan(1);
  });

  it("computes tile ranges for a viewport", () => {
    expect(tileRangeForViewport({ x: 300, y: 400 }, { x: 900, y: 1000 })).toEqual({
      minX: 1,
      maxX: 3,
      minY: 1,
      maxY: 3,
    });
  });
});
