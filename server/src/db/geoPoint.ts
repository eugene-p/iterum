export type GeoPoint = {
  lat: number;
  lon: number;
  elevation_m: number | null;
};

const parseCompositeField = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === "null") return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
};

const parseCompositeString = (value: string): GeoPoint | null => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("(") || !trimmed.endsWith(")")) return null;

  const parts: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of trimmed.slice(1, -1)) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);

  if (parts.length < 2) return null;
  const lat = parseCompositeField(parts[0]);
  const lon = parseCompositeField(parts[1]);
  if (lat == null || lon == null) return null;

  const elevationRaw = parts.length > 2 ? parseCompositeField(parts[2]) : null;
  return { lat, lon, elevation_m: elevationRaw };
};

export class GeoPointParseError extends Error {
  constructor(message = "Invalid geo_point value") {
    super(message);
    this.name = "GeoPointParseError";
  }
}

/** Parse a geo_point from a composite string or object. Throws on invalid input. */
export const parseGeoPoint = (value: unknown): GeoPoint => {
  if (value == null) {
    throw new GeoPointParseError("geo_point is null");
  }

  if (typeof value === "string") {
    const parsed = parseCompositeString(value);
    if (!parsed) throw new GeoPointParseError(`Cannot parse geo_point: ${value}`);
    return parsed;
  }

  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return {
        lat,
        lon,
        elevation_m: row.elevation_m == null ? null : Number(row.elevation_m),
      };
    }
  }

  throw new GeoPointParseError(`Cannot parse geo_point from ${typeof value}`);
};

export const geoPointSql = (baseParam: number): string =>
  `ROW($${baseParam}, $${baseParam + 1}, $${baseParam + 2})::geo_point`;

export const pushGeoPoint = (values: unknown[], point: GeoPoint): void => {
  values.push(point.lat, point.lon, point.elevation_m);
};

export const geoPointFromLatLon = (
  lat: number,
  lon: number,
  elevation_m: number | null = null,
): GeoPoint => ({ lat, lon, elevation_m });

export const geoPointSelect = (column: string, prefix: string): string =>
  `(${column}).lat AS ${prefix}_lat, (${column}).lon AS ${prefix}_lon, (${column}).elevation_m AS ${prefix}_elevation_m`;

export const geoPointFromRow = (
  row: Record<string, unknown>,
  prefix: string,
): GeoPoint => ({
  lat: Number(row[`${prefix}_lat`]),
  lon: Number(row[`${prefix}_lon`]),
  elevation_m:
    row[`${prefix}_elevation_m`] == null ? null : Number(row[`${prefix}_elevation_m`]),
});

export const mapSegmentRow = <T extends Record<string, unknown>>(row: T) => {
  const hasFlatEndpoints =
    row.start_lat != null &&
    row.start_lon != null &&
    row.end_lat != null &&
    row.end_lon != null;

  const start = hasFlatEndpoints
    ? {
        lat: Number(row.start_lat),
        lon: Number(row.start_lon),
        elevation_m: null,
      }
    : parseGeoPoint(row.start_point);
  const end = hasFlatEndpoints
    ? {
        lat: Number(row.end_lat),
        lon: Number(row.end_lon),
        elevation_m: null,
      }
    : parseGeoPoint(row.end_point);

  const { start_point: _startPoint, end_point: _endPoint, ...rest } = row;
  return {
    ...rest,
    start_lat: start.lat,
    start_lon: start.lon,
    end_lat: end.lat,
    end_lon: end.lon,
  };
};

export const mapTrackPointRow = (row: {
  lat: number;
  lon: number;
  elevation_m: number | null;
  heart_rate: number | null;
  speed_mps: number | null;
  timestamp: string | null;
}) => ({
  lat: Number(row.lat),
  lon: Number(row.lon),
  elevation_m: row.elevation_m == null ? null : Number(row.elevation_m),
  heart_rate: row.heart_rate,
  speed_mps: row.speed_mps,
  timestamp: row.timestamp,
});
