import { describe, expect, it } from "vitest";
import {
  GeoPointParseError,
  geoPointFromLatLon,
  geoPointFromRow,
  geoPointSelect,
  geoPointSql,
  mapSegmentRow,
  mapTrackPointRow,
  parseGeoPoint,
  pushGeoPoint,
} from "@/db/geoPoint.js";

describe("parseGeoPoint", () => {
  it("parses composite text", () => {
    const point = parseGeoPoint("(48.2082,16.3738,171)");
    expect(point.lat).toBe(48.2082);
    expect(point.lon).toBe(16.3738);
    expect(point.elevation_m).toBe(171);
  });

  it("parses null elevation and quoted composite fields", () => {
    expect(parseGeoPoint("(48.2082,16.3738,)").elevation_m).toBeNull();
    expect(parseGeoPoint('(48.2,"16.3",null)').lon).toBe(16.3);
  });

  it("parses composite objects", () => {
    expect(parseGeoPoint({ lat: 49, lon: 18, elevation_m: 200 })).toEqual({
      lat: 49,
      lon: 18,
      elevation_m: 200,
    });
    expect(parseGeoPoint({ lat: 49, lon: 18 }).elevation_m).toBeNull();
  });

  it("rejects invalid values", () => {
    expect(() => parseGeoPoint(null)).toThrow(GeoPointParseError);
    expect(() => parseGeoPoint("not-a-point")).toThrow(GeoPointParseError);
    expect(() => parseGeoPoint("(only-one)")).toThrow(GeoPointParseError);
    expect(() => parseGeoPoint(42)).toThrow(GeoPointParseError);
    expect(() => parseGeoPoint({ lat: "x", lon: 1 })).toThrow(GeoPointParseError);
  });
});

describe("geo point SQL helpers", () => {
  it("builds SQL fragments and parameter lists", () => {
    expect(geoPointSql(4)).toBe("ROW($4, $5, $6)::geo_point");
    expect(geoPointSelect("point", "pt")).toContain("pt_lat");
    expect(geoPointSelect("point", "pt")).toContain("pt_lon");

    const values: unknown[] = [];
    pushGeoPoint(values, geoPointFromLatLon(1, 2, 3));
    expect(values).toEqual([1, 2, 3]);
    expect(geoPointFromLatLon(1, 2).elevation_m).toBeNull();
  });

  it("reads prefixed row columns", () => {
    expect(
      geoPointFromRow(
        { start_lat: "48.1", start_lon: "16.2", start_elevation_m: "100" },
        "start",
      ),
    ).toEqual({ lat: 48.1, lon: 16.2, elevation_m: 100 });

    expect(
      geoPointFromRow({ end_lat: 1, end_lon: 2, end_elevation_m: null }, "end").elevation_m,
    ).toBeNull();
  });
});

describe("mapSegmentRow", () => {
  it("prefers flat endpoint columns when present", () => {
    const mapped = mapSegmentRow({
      id: 1,
      start_lat: 48,
      start_lon: 16,
      end_lat: 49,
      end_lon: 17,
      start_point: "(0,0)",
      end_point: "(1,1)",
    });
    expect(mapped).toMatchObject({
      id: 1,
      start_lat: 48,
      start_lon: 16,
      end_lat: 49,
      end_lon: 17,
    });
    expect(mapped).not.toHaveProperty("start_point");
    expect(mapped).not.toHaveProperty("end_point");
  });

  it("falls back to composite start/end points", () => {
    const mapped = mapSegmentRow({
      id: 2,
      start_point: "(48.2,16.3,10)",
      end_point: "(48.3,16.4,20)",
    });
    expect(mapped.start_lat).toBe(48.2);
    expect(mapped.end_lon).toBe(16.4);
  });
});

describe("mapTrackPointRow", () => {
  it("normalizes numeric coordinates and nullable elevation", () => {
    expect(
      mapTrackPointRow({
        lat: 48,
        lon: 16,
        elevation_m: null,
        heart_rate: 120,
        speed_mps: 3,
        timestamp: "2024-01-01T00:00:00Z",
      }),
    ).toEqual({
      lat: 48,
      lon: 16,
      elevation_m: null,
      heart_rate: 120,
      speed_mps: 3,
      timestamp: "2024-01-01T00:00:00Z",
    });

    expect(
      mapTrackPointRow({
        lat: 1,
        lon: 2,
        elevation_m: 50,
        heart_rate: null,
        speed_mps: null,
        timestamp: null,
      }).elevation_m,
    ).toBe(50);
  });
});
