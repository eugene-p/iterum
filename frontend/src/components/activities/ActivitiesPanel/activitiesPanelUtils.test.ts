import { describe, expect, it } from "vitest";
import type { ActivitySummary } from "../../../types";
import {
  activityContextLine,
  activityListFiltersAreActive,
  activityStatsLine,
  routeClusterMetaLine,
} from "./activitiesPanelUtils";
import type { ActivityRouteCluster } from "../../../lib/activityRouteCluster";

const base: ActivitySummary = {
  id: 1,
  name: "Morning run in Park (hilly)",
  created_at: "2024-06-15T10:00:00Z",
  source_format: "tcx",
  source_filename: "run.tcx",
  point_count: 100,
  tags: ["morning", "run"],
  location: "Park",
  distance_m: 10_000,
  duration_sec: 3600,
  avg_hr: 148,
  profile_id: 1,
  profile_name: "Default",
};

describe("activityStatsLine", () => {
  it("joins distance duration and hr", () => {
    expect(activityStatsLine(base)).toContain("km");
    expect(activityStatsLine(base)).toContain("bpm");
    expect(activityStatsLine(base)).not.toContain("Park");
  });
});

describe("activityContextLine", () => {
  it("includes tags location and format", () => {
    const line = activityContextLine(base);
    expect(line).toMatch(/run/i);
    expect(line).toContain("Park");
    expect(line).toContain("TCX");
  });
});

describe("routeClusterMetaLine", () => {
  it("summarizes count last date and distance band", () => {
    const cluster: ActivityRouteCluster = {
      id: "route-2",
      title: "Morning run",
      representative: {
        ...base,
        id: 2,
        started_at: "2024-07-22T08:00:00Z",
        distance_m: 10_500,
      },
      activities: [
        { ...base, id: 1, distance_m: 10_000, started_at: "2024-07-20T08:00:00Z" },
        {
          ...base,
          id: 2,
          distance_m: 10_500,
          started_at: "2024-07-22T08:00:00Z",
        },
      ],
    };

    const line = routeClusterMetaLine(cluster, new Date("2024-07-28T12:00:00Z"));
    expect(line).toContain("2 activities");
    expect(line).toMatch(/\d+d ago|just now|h ago|m ago|mo ago|y ago|Jul/);
    expect(line).not.toMatch(/last last|last just now/);
    expect(line).toContain("–");
  });
});

describe("activityListFiltersAreActive", () => {
  it("is inactive for defaults", () => {
    expect(activityListFiltersAreActive(true, "", "timeline", null)).toBe(false);
  });

  it("is active for route mode or day filter", () => {
    expect(activityListFiltersAreActive(true, "", "route", null)).toBe(true);
    expect(activityListFiltersAreActive(true, "", "timeline", "2024-07-22")).toBe(true);
  });
});
