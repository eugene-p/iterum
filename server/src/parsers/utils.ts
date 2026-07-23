import { BadRequestError } from "../middleware/errors.js";
import { enrichParsedPoints } from "../services/trackPointMetrics.js";
import type { ParsedActivity, ParsedPoint } from "../types.js";

export function semicirclesToDegrees(value: number): number {
  return value * (180 / 2 ** 31);
}

export function parseNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseDateFromText(text: string): Date | null {
  const candidates = [text, text.replace(/\.[^.]+$/, "")];

  for (const candidate of candidates) {
    let match = candidate.match(
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?\s*(?:—|-)?/,
    );
    if (match) {
      return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0));
    }

    match = candidate.match(/(\d{4})-(\d{2})-(\d{2})[T_\s](\d{2})[:-]?(\d{2})(?:[:-]?(\d{2}))?/);
    if (match) {
      return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0));
    }

    match = candidate.match(/(\d{4})(\d{2})(\d{2})[_\-\s]?(\d{2})(\d{2})(\d{2})?/);
    if (match) {
      return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +(match[6] || 0));
    }

    match = candidate.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(+match[1], +match[2] - 1, +match[3]);
    }
  }

  return null;
}

export function finalizeActivity(
  partial: Omit<ParsedActivity, "avgHr" | "maxHr"> & { avgHr?: number | null; maxHr?: number | null },
  fallbackName: string,
): ParsedActivity {
  const points = enrichParsedPoints(
    partial.points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)),
  );
  if (points.length === 0) {
    throw new BadRequestError("No GPS track points found");
  }

  const heartRates = points.map((p) => p.heartRate).filter((hr): hr is number => hr != null);
  const avgHr =
    partial.avgHr ?? (heartRates.length ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : null);
  const maxHr = partial.maxHr ?? (heartRates.length ? Math.max(...heartRates) : null);

  let startedAt =
    partial.startedAt ?? points[0].timestamp ?? parseDateFromText(fallbackName) ?? parseDateFromText(partial.name ?? "");
  let durationSec = partial.durationSec;
  if (durationSec == null && points[0].timestamp && points.at(-1)?.timestamp) {
    durationSec = (points.at(-1)!.timestamp!.getTime() - points[0].timestamp!.getTime()) / 1000;
  }

  let distanceM = partial.distanceM;
  if (distanceM == null) {
    const last = points.map((p) => p.distanceM).filter((d): d is number => d != null).at(-1);
    distanceM = last ?? null;
  }

  const name =
    partial.name ||
    (startedAt ? `${startedAt.toISOString().slice(0, 16).replace("T", " ")} — ${fallbackName}` : fallbackName);

  return {
    name,
    sport: partial.sport ?? null,
    startedAt,
    durationSec,
    distanceM,
    avgHr,
    maxHr,
    points,
  };
}

export function sortPoints(points: ParsedPoint[]): ParsedPoint[] {
  return [...points].sort((a, b) => {
    if (a.timestamp && b.timestamp) return a.timestamp.getTime() - b.timestamp.getTime();
    return 0;
  });
}