import { BadRequestError } from "../middleware/errors.js";
import type { ParsedActivity, ParsedPoint } from "../types.js";
import { finalizeActivity, parseDate, parseNumber, sortPoints } from "./utils.js";

const LAT_KEYS = ["lat", "latitude", "position_lat"];
const LON_KEYS = ["lon", "lng", "longitude", "position_long", "position_lon"];
const ELE_KEYS = ["ele", "elevation", "altitude", "alt"];
const HR_KEYS = ["hr", "heart_rate", "heartrate", "pulse"];
const SPEED_KEYS = ["speed", "speed_mps", "velocity"];
const TIME_KEYS = ["time", "timestamp", "datetime", "date"];
const DIST_KEYS = ["distance", "distance_m"];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

function pickColumn(headers: string[], candidates: string[]): number | null {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate);
    if (idx >= 0) return idx;
  }
  return null;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

export function parseCsv(content: string, filename: string): ParsedActivity {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new BadRequestError("CSV must include a header row and at least one data row");
  }

  const delimiter = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);

  const latIdx = pickColumn(headers, LAT_KEYS);
  const lonIdx = pickColumn(headers, LON_KEYS);
  if (latIdx == null || lonIdx == null) {
    throw new BadRequestError("CSV must include latitude and longitude columns");
  }

  const eleIdx = pickColumn(headers, ELE_KEYS);
  const hrIdx = pickColumn(headers, HR_KEYS);
  const speedIdx = pickColumn(headers, SPEED_KEYS);
  const timeIdx = pickColumn(headers, TIME_KEYS);
  const distIdx = pickColumn(headers, DIST_KEYS);

  const points: ParsedPoint[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line, delimiter);
    const lat = parseNumber(cols[latIdx]);
    const lon = parseNumber(cols[lonIdx]);
    if (lat == null || lon == null) continue;

    points.push({
      timestamp: timeIdx != null ? parseDate(cols[timeIdx]) : null,
      lat,
      lon,
      elevationM: eleIdx != null ? parseNumber(cols[eleIdx]) : null,
      heartRate: hrIdx != null ? parseNumber(cols[hrIdx]) : null,
      speedMps: speedIdx != null ? parseNumber(cols[speedIdx]) : null,
      distanceM: distIdx != null ? parseNumber(cols[distIdx]) : null,
    });
  }

  return finalizeActivity(
    {
      name: filename,
      sport: null,
      startedAt: points[0]?.timestamp ?? null,
      durationSec: null,
      distanceM: null,
      points: sortPoints(points),
    },
    filename,
  );
}