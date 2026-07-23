import { XMLParser } from "fast-xml-parser";
import type { ParsedActivity, ParsedPoint } from "../types.js";
import { finalizeActivity, parseDate, parseNumber, sortPoints } from "./utils.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pointFromTcx(tp: Record<string, unknown>): ParsedPoint | null {
  const pos = tp.Position as Record<string, unknown> | undefined;
  const lat = parseNumber(pos?.LatitudeDegrees);
  const lon = parseNumber(pos?.LongitudeDegrees);
  if (lat == null || lon == null) return null;

  return {
    timestamp: parseDate(tp.Time),
    lat,
    lon,
    elevationM: parseNumber(tp.AltitudeMeters),
    heartRate: parseNumber((tp.HeartRateBpm as Record<string, unknown> | undefined)?.Value),
    speedMps: null,
    distanceM: parseNumber(tp.DistanceMeters),
  };
}

export function parseTcx(content: string, filename: string): ParsedActivity {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(content);
  const db = doc.TrainingCenterDatabase ?? doc;
  const activities = asArray(db.Activities?.Activity);
  const points: ParsedPoint[] = [];
  let sport: string | null = null;
  let startedAt: Date | null = null;

  for (const activity of activities) {
    sport = activity["@_Sport"] ? String(activity["@_Sport"]) : sport;
    startedAt = parseDate(activity.Id) ?? startedAt;
    for (const lap of asArray(activity.Lap)) {
      const track = lap.Track as Record<string, unknown> | undefined;
      for (const tp of asArray(track?.Trackpoint)) {
        const point = pointFromTcx(tp as Record<string, unknown>);
        if (point) points.push(point);
      }
    }
  }

  return finalizeActivity(
    {
      name: filename,
      sport,
      startedAt,
      durationSec: null,
      distanceM: null,
      points: sortPoints(points),
    },
    filename,
  );
}