/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import type { ParsedActivity } from "../types.js";
import type { MetadataPointRow } from "./metadataEnrichment.js";
import type { TrackPointRow } from "./segmentMatcher.js";

export const trackPointsToMetadata = (points: readonly TrackPointRow[]): MetadataPointRow[] =>
  points.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    elevation_m: point.elevation_m,
    speed_mps: point.speed_mps,
    timestamp: point.timestamp,
  }));

export const parsedActivityToMetadata = (parsed: ParsedActivity): MetadataPointRow[] =>
  parsed.points.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    elevation_m: point.elevationM,
    speed_mps: point.speedMps,
    timestamp: point.timestamp?.toISOString() ?? null,
  }));