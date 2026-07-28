import FitParser from "fit-file-parser";
import { BadRequestError } from "../middleware/errors.js";
import type { ParsedActivity, ParsedPoint } from "../types.js";
import { finalizeActivity, parseDate, parseNumber, sortPoints } from "./utils.js";

type FitBinary = Buffer | ArrayBuffer | Uint8Array;

type FitRecord = {
  timestamp?: string | Date;
  position_lat?: number;
  position_long?: number;
  altitude?: number;
  enhanced_altitude?: number;
  heart_rate?: number;
  speed?: number;
  enhanced_speed?: number;
  distance?: number;
};

type FitSession = {
  sport?: string;
  start_time?: string | Date;
  timestamp?: string | Date;
  total_elapsed_time?: number;
  total_timer_time?: number;
  total_distance?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
};

const toArrayBuffer = (content: FitBinary): ArrayBuffer => {
  if (content instanceof ArrayBuffer) return content;
  const bytes = Buffer.isBuffer(content)
    ? content
    : Buffer.from(content.buffer, content.byteOffset, content.byteLength);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const pointFromFitRecord = (record: FitRecord): ParsedPoint | null => {
  const lat = parseNumber(record.position_lat);
  const lon = parseNumber(record.position_long);
  if (lat == null || lon == null) return null;

  return {
    timestamp: parseDate(record.timestamp),
    lat,
    lon,
    elevationM: parseNumber(record.enhanced_altitude ?? record.altitude),
    heartRate: parseNumber(record.heart_rate),
    speedMps: parseNumber(record.enhanced_speed ?? record.speed),
    distanceM: parseNumber(record.distance),
  };
};

const parseFitData = async (content: FitBinary) => {
  const parser = new FitParser({
    force: true,
    mode: "list",
    lengthUnit: "m",
    speedUnit: "m/s",
  });

  try {
    return await parser.parseAsync(toArrayBuffer(content));
  } catch (err) {
    const message = typeof err === "string" ? err : err instanceof Error ? err.message : "Failed to parse FIT file";
    throw new BadRequestError(message);
  }
};

export const parseFit = async (content: FitBinary, filename: string): Promise<ParsedActivity> => {
  const data = await parseFitData(content);
  const records = (data.records ?? []) as FitRecord[];
  const points = sortPoints(
    records.map(pointFromFitRecord).filter((point): point is ParsedPoint => point != null),
  );

  const session = ((data.sessions ?? [])[0] ?? null) as FitSession | null;
  const startedAt =
    parseDate(session?.start_time) ?? parseDate(session?.timestamp) ?? points[0]?.timestamp ?? null;

  return finalizeActivity(
    {
      name: filename,
      sport: session?.sport ? String(session.sport) : null,
      startedAt,
      durationSec: parseNumber(session?.total_elapsed_time ?? session?.total_timer_time),
      distanceM: parseNumber(session?.total_distance),
      avgHr: parseNumber(session?.avg_heart_rate),
      maxHr: parseNumber(session?.max_heart_rate),
      points,
    },
    filename,
  );
};
