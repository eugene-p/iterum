/** Meters per degree of latitude (WGS84 mean). Keep in sync with geo_gate_bounds() in server/migrations. */
export const METERS_PER_DEGREE_LAT = 111_320;

export type LatLonBounds = {
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
};

export const metersToLatDelta = (meters: number): number => meters / METERS_PER_DEGREE_LAT;

export const metersToLonDelta = (meters: number, atLat: number): number =>
  meters / (METERS_PER_DEGREE_LAT * Math.cos((atLat * Math.PI) / 180));

/** Axis-aligned bounds containing a circle of radius_m around a gate point. */
export const gateBoundsFromPoint = (
  lat: number,
  lon: number,
  radiusM: number,
): LatLonBounds => {
  const latPad = metersToLatDelta(radiusM);
  const lonPad = metersToLonDelta(radiusM, lat);
  return {
    min_lat: lat - latPad,
    max_lat: lat + latPad,
    min_lon: lon - lonPad,
    max_lon: lon + lonPad,
  };
};

export const unionBounds = (a: LatLonBounds, b: LatLonBounds): LatLonBounds => ({
  min_lat: Math.min(a.min_lat, b.min_lat),
  max_lat: Math.max(a.max_lat, b.max_lat),
  min_lon: Math.min(a.min_lon, b.min_lon),
  max_lon: Math.max(a.max_lon, b.max_lon),
});

export const segmentGateBounds = (segment: {
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m: number;
}): { start: LatLonBounds; end: LatLonBounds; union: LatLonBounds } => {
  const start = gateBoundsFromPoint(segment.start_lat, segment.start_lon, segment.radius_m);
  const end = gateBoundsFromPoint(segment.end_lat, segment.end_lon, segment.radius_m);
  return { start, end, union: unionBounds(start, end) };
};