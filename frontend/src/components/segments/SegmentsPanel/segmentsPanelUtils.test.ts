import { describe, expect, it } from "vitest";
import type { Segment } from "../../../types";
import {
  matchesSegmentSearch,
  segmentContextMetaLine,
  segmentFiltersAreActive,
  segmentFiltersSummary,
  segmentMatchMetaLine,
  segmentMetaLine,
} from "./segmentsPanelUtils";

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
  const now = new Date("2026-07-23T12:00:00Z");

  it("puts match stats before tags/location in combined meta", () => {
    const meta = segmentMetaLine(
      {
        ...baseSegment,
        location: "Kitsilano",
        tags: ["climb", "hills"],
        match_activity_count: 12,
        matched_last_30d: 3,
        last_matched_at: "2026-07-19T12:00:00Z",
      },
      now,
    );
    expect(meta.indexOf("12 activities")).toBeLessThan(meta.indexOf("climb"));
    expect(meta).toContain("3 in last 30d");
    expect(meta).toContain("last 4d ago");
    expect(meta).toContain("Kitsilano");
    expect(meta).not.toContain("threshold");
    expect(meta).not.toContain("radius");
  });

  it("keeps match line free of tags", () => {
    const match = segmentMatchMetaLine(
      {
        ...baseSegment,
        tags: ["climb"],
        location: "Kitsilano",
        match_activity_count: 12,
        matched_last_30d: 3,
        last_matched_at: "2026-07-19T12:00:00Z",
      },
      now,
    );
    expect(match).toBe("12 activities · 3 in last 30d · last 4d ago");
    expect(match).not.toContain("climb");
    expect(match).not.toContain("Kitsilano");
  });

  it("puts tags and location only on context line", () => {
    expect(
      segmentContextMetaLine({
        ...baseSegment,
        tags: ["climb", "hills"],
        location: "Kitsilano",
      }),
    ).toBe("climb · hills · Kitsilano");
    expect(segmentContextMetaLine(baseSegment)).toBeNull();
  });

  it("shows no matches when count is zero or missing", () => {
    expect(segmentMatchMetaLine(baseSegment, now)).toBe("No matches yet");
    expect(segmentMatchMetaLine({ ...baseSegment, match_activity_count: 0 }, now)).toBe(
      "No matches yet",
    );
  });

  it("uses singular activity label for one match", () => {
    const meta = segmentMatchMetaLine(
      {
        ...baseSegment,
        match_activity_count: 1,
        matched_last_30d: 1,
        last_matched_at: "2026-07-23T10:00:00Z",
      },
      now,
    );
    expect(meta).toContain("1 activity");
    expect(meta).not.toContain("1 activities");
  });

  it("summarizes collapsed filters with sort and optional query", () => {
    expect(segmentFiltersSummary("last_matched", "")).toBe("Last matched");
    expect(segmentFiltersSummary("match_count", "  climb ")).toBe(
      "Most matches · “climb”",
    );
    expect(segmentFiltersAreActive("last_matched", "")).toBe(false);
    expect(segmentFiltersAreActive("created", "")).toBe(true);
    expect(segmentFiltersAreActive("last_matched", "x")).toBe(true);
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
