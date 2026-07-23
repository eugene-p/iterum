/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import {
  computeElevationGain,
  deriveActivityTags,
  deriveSegmentTags,
  type TaggingPoint,
} from "../tagging/index.js";
import { deriveDisplayName } from "../tagging/deriveDisplayName.js";
import { resolveActivityLocation } from "./activityLocation.js";

export type MetadataPointRow = {
  lat: number;
  lon: number;
  elevation_m: number | null;
  speed_mps: number | null;
  timestamp: string | null;
};

export type ActivityMetadataInput = {
  name: string;
  sport: string | null;
  started_at: string | Date | null;
  duration_sec: number | null;
  distance_m: number | null;
  location: string | null;
};

export type ActivityMetadata = {
  name: string;
  location: string | null;
  tags: string[];
};

export type SegmentMetadataInput = {
  location: string | null;
};

export type ActivitySegmentContextInput = {
  location: string | null;
  sport: string | null;
};

export type SegmentMetadata = {
  location: string | null;
  tags: string[];
};

const toTaggingPoints = (points: readonly MetadataPointRow[]): TaggingPoint[] =>
  points.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    elevation_m: point.elevation_m,
    speed_mps: point.speed_mps,
    timestamp: point.timestamp,
  }));

const toStartedAt = (value: string | Date | null): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const enrichActivityMetadata = async (
  activity: ActivityMetadataInput,
  points: readonly MetadataPointRow[],
  options?: { geocode?: boolean; geocodeDelayMs?: number },
): Promise<ActivityMetadata> => {
  const startPoint = points[0];
  if (!startPoint) {
    return { name: activity.name, location: activity.location, tags: [] };
  }

  let location = activity.location;
  if (!location && options?.geocode !== false) {
    if (options?.geocodeDelayMs) await sleep(options.geocodeDelayMs);
    location = await resolveActivityLocation(startPoint.lat, startPoint.lon).catch(() => null);
  }

  const elevationGainM = computeElevationGain(toTaggingPoints(points));
  const tags = deriveActivityTags({
    sport: activity.sport,
    startedAt: toStartedAt(activity.started_at),
    distanceM: activity.distance_m,
    durationSec: activity.duration_sec,
    elevationGainM,
    startLon: startPoint.lon,
  });

  const name = deriveDisplayName({ tags, location }) ?? activity.name;

  return { name, location, tags };
};

export const enrichSegmentMetadata = async (
  segment: SegmentMetadataInput,
  referencePoints: readonly MetadataPointRow[],
  activityContext: ActivitySegmentContextInput,
  options?: { geocode?: boolean; geocodeDelayMs?: number },
): Promise<SegmentMetadata> => {
  const startPoint = referencePoints[0];
  let location = segment.location ?? activityContext.location;

  if (!location && startPoint && options?.geocode !== false) {
    if (options?.geocodeDelayMs) await sleep(options.geocodeDelayMs);
    location = await resolveActivityLocation(startPoint.lat, startPoint.lon).catch(() => null);
  }

  const tags = deriveSegmentTags({
    points: toTaggingPoints(referencePoints),
    activitySport: activityContext.sport,
  });

  return { location, tags };
};