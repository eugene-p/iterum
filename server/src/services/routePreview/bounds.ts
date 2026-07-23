export type RoutePreviewPoint = { lat: number; lon: number };

export type RoutePreviewBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export const computeRoutePreviewBounds = (
  points: ReadonlyArray<RoutePreviewPoint>,
): RoutePreviewBounds | null => {
  if (points.length === 0) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  }

  return { minLat, maxLat, minLon, maxLon };
};

/** Pad bounds in lat/lon space so routes do not touch the image edge. */
export const expandRoutePreviewBounds = (
  bounds: RoutePreviewBounds,
  paddingRatio = 0.12,
): RoutePreviewBounds => {
  const latSpan = Math.max(bounds.maxLat - bounds.minLat, 1e-6);
  const lonSpan = Math.max(bounds.maxLon - bounds.minLon, 1e-6);
  const latPad = latSpan * paddingRatio;
  const lonPad = lonSpan * paddingRatio;

  return {
    minLat: bounds.minLat - latPad,
    maxLat: bounds.maxLat + latPad,
    minLon: bounds.minLon - lonPad,
    maxLon: bounds.maxLon + lonPad,
  };
};

export const boundsCenter = (bounds: RoutePreviewBounds): RoutePreviewPoint => ({
  lat: (bounds.minLat + bounds.maxLat) / 2,
  lon: (bounds.minLon + bounds.maxLon) / 2,
});