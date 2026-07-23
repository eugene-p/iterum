import { XMLParser } from "fast-xml-parser";
import { BadRequestError } from "../middleware/errors.js";
import type { ParsedActivity, ParsedPoint } from "../types.js";
import { finalizeActivity, parseDate, parseNumber, sortPoints } from "./utils.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pointFromFitlog(tp: Record<string, unknown>, trackStart: Date): ParsedPoint | null {
  const lat = parseNumber(tp["@_lat"]);
  const lon = parseNumber(tp["@_lon"]);
  if (lat == null || lon == null) return null;

  const offsetSec = parseNumber(tp["@_tm"]) ?? 0;
  const timestamp = new Date(trackStart.getTime() + offsetSec * 1000);

  return {
    timestamp,
    lat,
    lon,
    elevationM: parseNumber(tp["@_ele"]),
    heartRate: parseNumber(tp["@_hr"]),
    speedMps: null,
    distanceM: null,
  };
}

function pointsFromTrack(track: Record<string, unknown>): ParsedPoint[] {
  const trackStart = parseDate(track["@_StartTime"]);
  if (!trackStart) return [];

  const points: ParsedPoint[] = [];
  for (const [key, value] of Object.entries(track)) {
    if (key.startsWith("@_") || key === "StartTime") continue;
    for (const node of asArray(value as Record<string, unknown>)) {
      const point = pointFromFitlog(node as Record<string, unknown>, trackStart);
      if (point) points.push(point);
    }
  }
  return points;
}

export function parseFitlog(content: string, filename: string): ParsedActivity {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(content);
  const root = doc.FitnessWorkbook ?? doc;
  const athleteLogs = asArray(root.AthleteLog);

  const activities: ParsedActivity[] = [];

  for (const log of athleteLogs) {
    for (const activity of asArray(log.Activity)) {
      const act = activity as Record<string, unknown>;
      const startedAt = parseDate(act["@_StartTime"]);
      const category = (act.Category as Record<string, unknown> | undefined)?.["@_Name"];
      const points: ParsedPoint[] = [];

      for (const track of asArray(act.Track as Record<string, unknown>)) {
        points.push(...pointsFromTrack(track as Record<string, unknown>));
      }

      if (points.length === 0) continue;

      activities.push(
        finalizeActivity(
          {
            name: startedAt ? `${startedAt.toISOString().slice(0, 10)} activity` : filename,
            sport: category ? String(category) : null,
            startedAt,
            durationSec: parseNumber((act.Duration as Record<string, unknown> | undefined)?.["@_TotalSeconds"]),
            distanceM: parseNumber((act.Distance as Record<string, unknown> | undefined)?.["@_TotalMeters"]),
            points: sortPoints(points),
          },
          filename,
        ),
      );
    }
  }

  if (activities.length === 0) {
    throw new BadRequestError("No activities with GPS data found in fitlog file");
  }

  if (activities.length === 1) return activities[0];

  const mergedPoints = sortPoints(activities.flatMap((a) => a.points));
  return finalizeActivity(
    {
      name: `${filename} (${activities.length} activities)`,
      sport: activities[0].sport,
      startedAt: activities[0].startedAt,
      durationSec: activities.reduce((sum, a) => sum + (a.durationSec ?? 0), 0) || null,
      distanceM: activities.reduce((sum, a) => sum + (a.distanceM ?? 0), 0) || null,
      points: mergedPoints,
    },
    filename,
  );
}