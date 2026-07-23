import { describe, expect, it } from "vitest";
import { BadRequestError } from "@/middleware/errors.js";
import { parseCsv } from "@/parsers/csv.js";

const sampleCsv = `lat,lon,hr,time
48.0,16.0,120,2024-01-01T10:00:00Z
48.001,16.0,140,2024-01-01T10:01:00Z`;

describe("parseCsv", () => {
  it("parses latitude and longitude columns", () => {
    const activity = parseCsv(sampleCsv, "track.csv");
    expect(activity.points).toHaveLength(2);
    expect(activity.avgHr).toBe(130);
    expect(activity.startedAt?.toISOString()).toBe("2024-01-01T10:00:00.000Z");
  });

  it("supports semicolon delimiters and optional columns", () => {
    const csv = `latitude;longitude;altitude;speed;distance
48.0;16.0;100;2.5;0
48.001;16.0;105;3;120
"48.002";16.0;110;2;240
bad;row;;;`;
    const activity = parseCsv(csv, "euro.csv");
    expect(activity.points).toHaveLength(3);
    expect(activity.points[0].elevationM).toBe(100);
    expect(activity.points[1].speedMps).toBe(3);
    expect(activity.points[2].distanceM).toBe(240);
  });

  it("requires latitude and longitude headers", () => {
    expect(() => parseCsv("speed,hr\n3,120", "bad.csv")).toThrow(BadRequestError);
  });

  it("requires a header and at least one data row", () => {
    expect(() => parseCsv("lat,lon", "empty.csv")).toThrow(BadRequestError);
  });
});
