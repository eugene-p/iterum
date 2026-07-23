import { describe, expect, it, vi } from "vitest";
import {
  createBoxProjector,
  solidColorBackgroundProvider,
} from "@/services/routePreview/mapBackground/solidColorBackgroundProvider.js";
import { createOsmTileBackgroundProvider } from "@/services/routePreview/mapBackground/osmTileProvider.js";
import type { RoutePreviewPaintContext } from "@/services/routePreview/mapBackground/types.js";

const bounds = {
  minLat: 48,
  maxLat: 48.01,
  minLon: 16,
  maxLon: 16.01,
};

describe("createBoxProjector", () => {
  it("projects corners into the padded canvas", () => {
    const project = createBoxProjector(bounds, 200, 100, 10);
    const [xMin, yMax] = project({ lat: bounds.minLat, lon: bounds.minLon });
    const [xMax, yMin] = project({ lat: bounds.maxLat, lon: bounds.maxLon });

    expect(xMin).toBeGreaterThanOrEqual(10);
    expect(xMax).toBeLessThanOrEqual(190);
    expect(yMin).toBeGreaterThanOrEqual(10);
    expect(yMax).toBeLessThanOrEqual(90);
    expect(xMax).toBeGreaterThan(xMin);
    expect(yMax).toBeGreaterThan(yMin);
  });

  it("handles degenerate single-point bounds", () => {
    const project = createBoxProjector(
      { minLat: 1, maxLat: 1, minLon: 2, maxLon: 2 },
      100,
      100,
      0,
    );
    const [x, y] = project({ lat: 1, lon: 2 });
    expect(Number.isFinite(x)).toBe(true);
    expect(Number.isFinite(y)).toBe(true);
  });
});

describe("solidColorBackgroundProvider", () => {
  it("is a no-op paint that identifies as solid", async () => {
    expect(solidColorBackgroundProvider.id).toBe("solid");
    const context: RoutePreviewPaintContext = { composites: [] };
    await solidColorBackgroundProvider.paint(context, {
      bounds,
      width: 10,
      height: 10,
      padding: 0,
    });
    expect(context.composites).toEqual([]);
  });
});

describe("createOsmTileBackgroundProvider", () => {
  it("composites tiles returned by the injected fetcher", async () => {
    const tile = Buffer.from("png");
    const fetchTile = vi.fn(async () => tile);
    const provider = createOsmTileBackgroundProvider({ fetchTile });
    const context: RoutePreviewPaintContext = { composites: [] };

    await provider.paint(context, {
      bounds,
      width: 256,
      height: 256,
      padding: 0,
    });

    expect(provider.id).toBe("osm-tiles");
    expect(fetchTile).toHaveBeenCalled();
    expect(context.composites.length).toBeGreaterThan(0);
    expect(context.composites[0].input).toBe(tile);
    expect(typeof context.composites[0].left).toBe("number");
    expect(typeof context.composites[0].top).toBe("number");
  });

  it("skips null tile buffers", async () => {
    const provider = createOsmTileBackgroundProvider({
      fetchTile: async () => null,
    });
    const context: RoutePreviewPaintContext = { composites: [] };

    await provider.paint(context, {
      bounds,
      width: 128,
      height: 128,
      padding: 8,
    });

    expect(context.composites).toEqual([]);
  });
});
