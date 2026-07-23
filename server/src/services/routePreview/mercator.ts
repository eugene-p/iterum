import type { RoutePreviewBounds, RoutePreviewPoint } from "./bounds.js";
import { boundsCenter } from "./bounds.js";

export const TILE_SIZE = 256;
export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 17;

export type WorldPixel = { x: number; y: number };

export const latLonToWorldPixel = (lat: number, lon: number, zoom: number): WorldPixel => {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lon + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
};

export const chooseZoomForBounds = (
  bounds: RoutePreviewBounds,
  width: number,
  height: number,
  padding: number,
): number => {
  const innerWidth = Math.max(width - padding * 2, 1);
  const innerHeight = Math.max(height - padding * 2, 1);

  for (let zoom = MAX_MAP_ZOOM; zoom >= MIN_MAP_ZOOM; zoom -= 1) {
    const northWest = latLonToWorldPixel(bounds.maxLat, bounds.minLon, zoom);
    const southEast = latLonToWorldPixel(bounds.minLat, bounds.maxLon, zoom);
    if (southEast.x - northWest.x <= innerWidth && southEast.y - northWest.y <= innerHeight) {
      return zoom;
    }
  }

  return MIN_MAP_ZOOM;
};

export const createMercatorProjector = (
  center: RoutePreviewPoint,
  zoom: number,
  width: number,
  height: number,
): ((point: RoutePreviewPoint) => [number, number]) => {
  const centerPixel = latLonToWorldPixel(center.lat, center.lon, zoom);

  return (point: RoutePreviewPoint) => {
    const pixel = latLonToWorldPixel(point.lat, point.lon, zoom);
    return [pixel.x - centerPixel.x + width / 2, pixel.y - centerPixel.y + height / 2];
  };
};

export const mercatorProjectorForBounds = (
  bounds: RoutePreviewBounds,
  width: number,
  height: number,
  padding: number,
): { zoom: number; projectPoint: (point: RoutePreviewPoint) => [number, number] } => {
  const zoom = chooseZoomForBounds(bounds, width, height, padding);
  const center = boundsCenter(bounds);
  return {
    zoom,
    projectPoint: createMercatorProjector(center, zoom, width, height),
  };
};

export const tileRangeForViewport = (
  topLeft: WorldPixel,
  bottomRight: WorldPixel,
): { minX: number; maxX: number; minY: number; maxY: number } => ({
  minX: Math.floor(topLeft.x / TILE_SIZE),
  maxX: Math.floor(bottomRight.x / TILE_SIZE),
  minY: Math.floor(topLeft.y / TILE_SIZE),
  maxY: Math.floor(bottomRight.y / TILE_SIZE),
});