import { describe, expect, it } from "vitest";
import { FitBaseType, FitEncoder } from "fit-file-parser";
import { BadRequestError } from "@/middleware/errors.js";
import { parseFit } from "@/parsers/fit.js";
import { detectFormat, parseActivityFile } from "@/parsers/index.js";

const degreesToSemicircles = (degrees: number): number =>
  Math.round((degrees * 2 ** 31) / 180);

const buildSampleFit = (): Buffer => {
  const start = new Date("2024-01-01T10:00:00Z");
  const end = new Date("2024-01-01T10:05:00Z");
  const encoder = new FitEncoder();

  encoder.writeMessage(0, [
    { number: 0, size: 1, baseType: FitBaseType.Enum, value: 4 },
    { number: 4, size: 4, baseType: FitBaseType.Uint32, value: FitEncoder.toFitTimestamp(start) },
  ]);

  encoder.writeMessage(18, [
    { number: 253, size: 4, baseType: FitBaseType.Uint32, value: FitEncoder.toFitTimestamp(end) },
    { number: 2, size: 4, baseType: FitBaseType.Uint32, value: FitEncoder.toFitTimestamp(start) },
    { number: 5, size: 1, baseType: FitBaseType.Enum, value: 1 },
    { number: 7, size: 4, baseType: FitBaseType.Uint32, value: 300_000 },
    { number: 9, size: 4, baseType: FitBaseType.Uint32, value: 12_000 },
    { number: 16, size: 1, baseType: FitBaseType.Uint8, value: 140 },
    { number: 17, size: 1, baseType: FitBaseType.Uint8, value: 160 },
  ]);

  const records = [
    { t: start, lat: 48.0, lon: 16.0, hr: 125, ele: 100, speed: 2.5, dist: 0 },
    { t: end, lat: 48.001, lon: 16.001, hr: 145, ele: 110, speed: 3, dist: 120 },
  ] as const;

  for (const record of records) {
    encoder.writeMessage(20, [
      { number: 253, size: 4, baseType: FitBaseType.Uint32, value: FitEncoder.toFitTimestamp(record.t) },
      { number: 0, size: 4, baseType: FitBaseType.Sint32, value: degreesToSemicircles(record.lat) },
      { number: 1, size: 4, baseType: FitBaseType.Sint32, value: degreesToSemicircles(record.lon) },
      { number: 2, size: 2, baseType: FitBaseType.Uint16, value: Math.round((record.ele + 500) * 5) },
      { number: 3, size: 1, baseType: FitBaseType.Uint8, value: record.hr },
      { number: 5, size: 4, baseType: FitBaseType.Uint32, value: Math.round(record.dist * 100) },
      { number: 6, size: 2, baseType: FitBaseType.Uint16, value: Math.round(record.speed * 1000) },
    ]);
  }

  return Buffer.from(encoder.close());
};

describe("parseFit", () => {
  it("extracts GPS records, HR, and session metadata", async () => {
    const activity = await parseFit(buildSampleFit(), "morning.fit");

    expect(activity.sport).toBe("running");
    expect(activity.startedAt?.toISOString()).toBe("2024-01-01T10:00:00.000Z");
    expect(activity.durationSec).toBeCloseTo(300, 0);
    expect(activity.distanceM).toBeCloseTo(120, 0);
    expect(activity.avgHr).toBe(140);
    expect(activity.maxHr).toBe(160);
    expect(activity.points).toHaveLength(2);
    expect(activity.points[0].lat).toBeCloseTo(48, 5);
    expect(activity.points[0].lon).toBeCloseTo(16, 5);
    expect(activity.points[0].elevationM).toBeCloseTo(100, 0);
    expect(activity.points[0].heartRate).toBe(125);
    expect(activity.points[0].speedMps).toBeCloseTo(2.5, 2);
    expect(activity.points[0].distanceM).toBeCloseTo(0, 0);
    expect(activity.points[1].heartRate).toBe(145);
    expect(activity.points[1].distanceM).toBeCloseTo(120, 0);
  });

  it("skips records without GPS and rejects empty tracks", async () => {
    const start = new Date("2024-01-01T10:00:00Z");
    const encoder = new FitEncoder();
    encoder.writeMessage(0, [
      { number: 0, size: 1, baseType: FitBaseType.Enum, value: 4 },
      { number: 4, size: 4, baseType: FitBaseType.Uint32, value: FitEncoder.toFitTimestamp(start) },
    ]);
    encoder.writeMessage(20, [
      { number: 253, size: 4, baseType: FitBaseType.Uint32, value: FitEncoder.toFitTimestamp(start) },
      { number: 3, size: 1, baseType: FitBaseType.Uint8, value: 120 },
    ]);

    await expect(parseFit(Buffer.from(encoder.close()), "indoor.fit")).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it("rejects non-FIT bytes", async () => {
    await expect(parseFit(Buffer.from("not a fit file"), "bad.fit")).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});

describe("parseActivityFile FIT integration", () => {
  it("detects .fit and routes binary content", async () => {
    expect(detectFormat("ride.fit")).toBe("fit");
    const activity = await parseActivityFile(buildSampleFit(), "ride.fit");
    expect(activity.points).toHaveLength(2);
    expect(activity.sport).toBe("running");
  });
});
