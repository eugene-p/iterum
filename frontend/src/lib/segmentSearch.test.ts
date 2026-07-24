import { describe, expect, it } from "vitest";
import type { Segment } from "../types";
import {
  filterAndSortSegmentsBySearch,
  sortSegments,
  type SegmentListSort,
} from "./segmentSearch";

const segment = (overrides: Partial<Segment> & Pick<Segment, "id" | "name">): Segment => ({
  source_activity_id: 1,
  start_index: 0,
  end_index: 10,
  start_lat: 0,
  start_lon: 0,
  end_lat: 1,
  end_lon: 1,
  radius_m: 30,
  match_threshold: 0.9,
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

describe("sortSegments", () => {
  const segments = [
    segment({
      id: 1,
      name: "Old active",
      last_matched_at: "2026-06-01T00:00:00Z",
      match_activity_count: 20,
      created_at: "2023-01-01T00:00:00Z",
    }),
    segment({
      id: 2,
      name: "Recent",
      last_matched_at: "2026-07-20T00:00:00Z",
      match_activity_count: 2,
      created_at: "2024-06-01T00:00:00Z",
    }),
    segment({
      id: 3,
      name: "Never matched",
      match_activity_count: 0,
      created_at: "2025-01-01T00:00:00Z",
    }),
  ];

  it("sorts by last matched descending and puts never-matched last", () => {
    expect(sortSegments(segments, "last_matched").map((s) => s.id)).toEqual([2, 1, 3]);
  });

  it("sorts by match count then recency", () => {
    expect(sortSegments(segments, "match_count").map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it("sorts by created at", () => {
    expect(sortSegments(segments, "created").map((s) => s.id)).toEqual([3, 2, 1]);
  });
});

describe("filterAndSortSegmentsBySearch", () => {
  const segments = [
    segment({
      id: 1,
      name: "Climb A",
      last_matched_at: "2026-06-01T00:00:00Z",
      match_activity_count: 5,
      created_at: "2023-01-01T00:00:00Z",
    }),
    segment({
      id: 2,
      name: "Climb B",
      last_matched_at: "2026-07-20T00:00:00Z",
      match_activity_count: 1,
      created_at: "2024-06-01T00:00:00Z",
    }),
    segment({
      id: 3,
      name: "Flat",
      last_matched_at: "2026-07-22T00:00:00Z",
      match_activity_count: 9,
      created_at: "2025-01-01T00:00:00Z",
    }),
  ];

  it("defaults to last_matched when query is empty", () => {
    expect(filterAndSortSegmentsBySearch(segments, "").map((s) => s.id)).toEqual([3, 2, 1]);
  });

  it("keeps search score first, then requested sort among equals", () => {
    const sort: SegmentListSort = "last_matched";
    expect(filterAndSortSegmentsBySearch(segments, "climb", sort).map((s) => s.id)).toEqual([
      2, 1,
    ]);
  });
});
