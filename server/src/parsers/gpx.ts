import { XMLParser } from "fast-xml-parser";
import type { ParsedActivity, ParsedPoint } from "../types.js";
import { finalizeActivity, parseDate, parseNumber, sortPoints } from "./utils.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function pointFromGpx(trkpt: Record<string, unknown>): ParsedPoint | null {
  const lat = parseNumber(trkpt["@_lat"]);
  const lon = parseNumber(trkpt["@_lon"]);
  if (lat == null || lon == null) return null;

  const extensions = trkpt.extensions as Record<string, unknown> | undefined;
  const gpxtpx = extensions?.["gpxtpx:TrackPointExtension"] as Record<string, unknown> | undefined;

  return {
    timestamp: parseDate(trkpt.time),
    lat,
    lon,
    elevationM: parseNumber(trkpt.ele),
    heartRate: parseNumber(gpxtpx?.["gpxtpx:hr"]),
    speedMps: null,
    distanceM: null,
  };
}

export function parseGpx(content: string, filename: string): ParsedActivity {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(content);
  const gpx = doc.gpx ?? doc;
  const tracks = asArray(gpx.trk);
  const points: ParsedPoint[] = [];

  for (const trk of tracks) {
    for (const seg of asArray(trk.trkseg)) {
      for (const trkpt of asArray(seg.trkpt)) {
        const point = pointFromGpx(trkpt as Record<string, unknown>);
        if (point) points.push(point);
      }
    }
  }

  if (points.length === 0) {
    for (const rte of asArray(gpx.rte)) {
      for (const rtept of asArray(rte.rtept)) {
        const point = pointFromGpx(rtept as Record<string, unknown>);
        if (point) points.push(point);
      }
    }
  }

  const metadata = gpx.metadata as Record<string, unknown> | undefined;
  return finalizeActivity(
    {
      name: String(tracks[0]?.name ?? filename),
      sport: null,
      startedAt: parseDate(metadata?.time) ?? points[0]?.timestamp ?? null,
      durationSec: null,
      distanceM: null,
      points: sortPoints(points),
    },
    filename,
  );
}