import { XMLParser } from "fast-xml-parser";
import type { ParsedActivity, ParsedPoint } from "../types.js";
import { finalizeActivity, parseNumber, sortPoints } from "./utils.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseCoordinates(text: string): ParsedPoint[] {
  const points: ParsedPoint[] = [];
  for (const chunk of text.trim().split(/\s+/)) {
    const [lon, lat, ele] = chunk.split(",").map((v) => parseNumber(v.trim()));
    if (lat == null || lon == null) continue;
    points.push({
      timestamp: null,
      lat,
      lon,
      elevationM: ele,
      heartRate: null,
      speedMps: null,
      distanceM: null,
    });
  }
  return points;
}

function collectPlacemarks(node: unknown, out: Record<string, unknown>[]): void {
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (obj.Placemark) {
    out.push(
      ...asArray(obj.Placemark as Record<string, unknown> | Record<string, unknown>[]),
    );
  }
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) value.forEach((v) => collectPlacemarks(v, out));
    else if (value && typeof value === "object") collectPlacemarks(value, out);
  }
}

export function parseKml(content: string, filename: string): ParsedActivity {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(content);
  const placemarks: Record<string, unknown>[] = [];
  collectPlacemarks(doc, placemarks);

  const points: ParsedPoint[] = [];
  let name = filename;

  for (const placemark of placemarks) {
    if (placemark.name) name = String(placemark.name);
    const line = placemark.LineString as Record<string, unknown> | undefined;
    const multi = placemark.MultiGeometry as Record<string, unknown> | undefined;
    const coords =
      line?.coordinates ??
      (multi?.LineString as Record<string, unknown> | undefined)?.coordinates;
    if (coords) points.push(...parseCoordinates(String(coords)));
  }

  return finalizeActivity(
    {
      name,
      sport: null,
      startedAt: null,
      durationSec: null,
      distanceM: null,
      points: sortPoints(points),
    },
    filename,
  );
}