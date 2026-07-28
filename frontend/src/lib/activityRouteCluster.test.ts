import { describe, expect, it } from "vitest";
import type { ActivitySummary } from "../types";
import {
  clusterActivitiesByRoute,
  routeShapeScore,
  type RouteSamplePoint,
} from "./activityRouteCluster";

const base: ActivitySummary = {
  id: 1,
  name: "Morning run in Park (hilly)",
  created_at: "2024-06-15T10:00:00Z",
  source_format: "tcx",
  source_filename: "run.tcx",
  point_count: 100,
  tags: ["run"],
  location: "Park",
  distance_m: 10_000,
  profile_id: 1,
  profile_name: "Default",
};

const activity = (overrides: Partial<ActivitySummary>): ActivitySummary => ({
  ...base,
  ...overrides,
});

/** Rough northbound 1 km line near 49°N. */
const lineA = (offsetLat = 0): RouteSamplePoint[] =>
  Array.from({ length: 11 }, (_, i) => ({
    lat: 49.25 + offsetLat + i * 0.0009,
    lon: -123.1,
  }));

const lineBFar = (): RouteSamplePoint[] =>
  Array.from({ length: 11 }, (_, i) => ({
    lat: 49.4 + i * 0.0009,
    lon: -122.8,
  }));

describe("routeShapeScore", () => {
  it("scores identical paths high", () => {
    const path = lineA();
    expect(routeShapeScore(path, path, 50)).toBeGreaterThan(0.9);
  });

  it("scores distant paths low", () => {
    expect(routeShapeScore(lineA(), lineBFar(), 50)).toBeLessThan(0.3);
  });
});

describe("clusterActivitiesByRoute", () => {
  it("keeps different profiles in separate clusters even on same path", () => {
    const a = activity({ id: 1, profile_id: 1, started_at: "2024-07-20T08:00:00Z" });
    const b = activity({ id: 2, profile_id: 2, started_at: "2024-07-21T08:00:00Z" });
    const samples = new Map([
      [1, lineA()],
      [2, lineA()],
    ]);

    const clusters = clusterActivitiesByRoute([a, b], samples);
    expect(clusters).toHaveLength(2);
  });

  it("groups similar distance + path activities in the same profile", () => {
    const a = activity({
      id: 1,
      distance_m: 10_000,
      started_at: "2024-07-20T08:00:00Z",
      name: "Morning run in Park (hilly)",
    });
    const b = activity({
      id: 2,
      distance_m: 10_500,
      started_at: "2024-07-22T08:00:00Z",
      name: "Morning run in Park (hilly)",
    });
    const c = activity({
      id: 3,
      distance_m: 10_200,
      started_at: "2024-07-10T08:00:00Z",
      name: "Other area",
      location: "Elsewhere",
    });

    const samples = new Map([
      [1, lineA()],
      [2, lineA(0.0001)],
      [3, lineBFar()],
    ]);

    const clusters = clusterActivitiesByRoute([a, b, c], samples);
    const sizes = clusters.map((cluster) => cluster.activities.length).sort((x, y) => y - x);
    expect(sizes[0]).toBe(2);
    expect(clusters).toHaveLength(2);

    const pair = clusters.find((cluster) => cluster.activities.length === 2)!;
    expect(pair.activities.map((row) => row.id).sort()).toEqual([1, 2]);
    expect(pair.representative.id).toBe(2);
    expect(pair.title).toContain("Park");
  });

  it("leaves activities without samples as singletons", () => {
    const a = activity({ id: 1, started_at: "2024-07-20T08:00:00Z" });
    const clusters = clusterActivitiesByRoute([a], new Map());
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.activities).toHaveLength(1);
  });

  it("does not merge when distance differs a lot", () => {
    const a = activity({ id: 1, distance_m: 5_000, started_at: "2024-07-20T08:00:00Z" });
    const b = activity({ id: 2, distance_m: 20_000, started_at: "2024-07-21T08:00:00Z" });
    const samples = new Map([
      [1, lineA()],
      [2, lineA()],
    ]);

    const clusters = clusterActivitiesByRoute([a, b], samples);
    expect(clusters).toHaveLength(2);
  });
});
