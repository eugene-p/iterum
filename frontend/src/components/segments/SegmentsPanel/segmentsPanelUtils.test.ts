import { describe, expect, it } from "vitest";
import type { Segment } from "../../../types";
import { matchesSegmentSearch, segmentMetaLine } from "./segmentsPanelUtils";

const baseSegment: Segment = {
  id: 1,
  name: "Hill repeat",
  source_activity_id: 2,
  start_index: 0,
  end_index: 10,
  start_lat: 49.2,
  start_lon: -123.1,
  end_lat: 49.21,
  end_lon: -123.09,
  radius_m: 30,
  match_threshold: 0.9,
  created_at: "2024-06-15T10:00:00Z",
};

describe("segmentsPanelUtils", () => {
  it("includes tags and location in meta line", () => {
    const meta = segmentMetaLine({
      ...baseSegment,
      location: "Kitsilano",
      tags: ["climb", "hills"],
    });
    expect(meta).toContain("climb · hills");
    expect(meta).toContain("Kitsilano");
  });

  it("matches search on tags", () => {
    const segment = {
      ...baseSegment,
      location: "Kitsilano",
      tags: ["climb"],
    };
    expect(matchesSegmentSearch(segment, "climb")).toBe(true);
    expect(matchesSegmentSearch(segment, "clm")).toBe(true);
  });

  it("falls back to name and extras when tag does not match", () => {
    const segment = {
      ...baseSegment,
      location: "Kitsilano",
      tags: ["climb"],
    };
    expect(matchesSegmentSearch(segment, "kitsilano")).toBe(true);
    expect(matchesSegmentSearch(segment, "hill")).toBe(true);
  });
});