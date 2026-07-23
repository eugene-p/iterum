import type { RoutePreviewBounds, RoutePreviewPoint } from "../bounds.js";
import type { MapBackgroundPaintRequest, MapBackgroundProvider } from "./types.js";

export const createBoxProjector = (
  bounds: RoutePreviewBounds,
  width: number,
  height: number,
  padding: number,
): ((point: RoutePreviewPoint) => [number, number]) => {
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 1e-9);
  const lonSpan = Math.max(bounds.maxLon - bounds.minLon, 1e-9);
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);
  const scale = Math.min(innerWidth / lonSpan, innerHeight / latSpan);
  const routeWidth = lonSpan * scale;
  const routeHeight = latSpan * scale;
  const offsetX = padding + (innerWidth - routeWidth) / 2;
  const offsetY = padding + (innerHeight - routeHeight) / 2;

  return (point: RoutePreviewPoint) => {
    const x = offsetX + ((point.lon - bounds.minLon) / lonSpan) * routeWidth;
    const y = offsetY + ((bounds.maxLat - point.lat) / latSpan) * routeHeight;
    return [x, y];
  };
};

export const solidColorBackgroundProvider: MapBackgroundProvider = {
  id: "solid",

  async paint(_context, _request: MapBackgroundPaintRequest) {
    // Background fill is applied when the base canvas is created.
  },
};