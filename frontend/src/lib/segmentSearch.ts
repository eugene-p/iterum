import type { Segment } from "../types";
import { matchesFuzzySearch, scoreFuzzySearch, type SearchFields } from "./fuzzySearch";

export type SegmentListSort = "last_matched" | "match_count" | "created";

export const DEFAULT_SEGMENT_LIST_SORT: SegmentListSort = "last_matched";

export const SEGMENT_LIST_SORT_OPTIONS: ReadonlyArray<{
  value: SegmentListSort;
  label: string;
}> = [
  { value: "last_matched", label: "Last matched" },
  { value: "match_count", label: "Most matches" },
  { value: "created", label: "Newest" },
];

export const segmentSearchFields = (segment: Segment): SearchFields => ({
  tags: segment.tags,
  name: segment.name,
  extras: [
    segment.description ?? "",
    segment.location ?? "",
    String(segment.id),
    String(segment.radius_m),
    String(Math.round(segment.match_threshold * 100)),
  ],
});

export const matchesSegmentSearch = (segment: Segment, query: string): boolean =>
  matchesFuzzySearch(segmentSearchFields(segment), query);

const lastMatchedTime = (segment: Segment): number => {
  if (!segment.last_matched_at) return 0;
  const t = new Date(segment.last_matched_at).getTime();
  return Number.isFinite(t) ? t : 0;
};

const matchCount = (segment: Segment): number => segment.match_activity_count ?? 0;

const createdTime = (segment: Segment): number => new Date(segment.created_at).getTime();

const compareBySort = (a: Segment, b: Segment, sort: SegmentListSort): number => {
  if (sort === "match_count") {
    const byCount = matchCount(b) - matchCount(a);
    if (byCount !== 0) return byCount;
    const byMatched = lastMatchedTime(b) - lastMatchedTime(a);
    if (byMatched !== 0) return byMatched;
    return createdTime(b) - createdTime(a);
  }

  if (sort === "created") {
    return createdTime(b) - createdTime(a);
  }

  const byMatched = lastMatchedTime(b) - lastMatchedTime(a);
  if (byMatched !== 0) return byMatched;
  const byCount = matchCount(b) - matchCount(a);
  if (byCount !== 0) return byCount;
  return createdTime(b) - createdTime(a);
};

export const sortSegmentsByCreated = (segments: Segment[]): Segment[] =>
  sortSegments(segments, "created");

export const sortSegments = (
  segments: Segment[],
  sort: SegmentListSort = DEFAULT_SEGMENT_LIST_SORT,
): Segment[] => [...segments].sort((a, b) => compareBySort(a, b, sort));

export const filterAndSortSegmentsBySearch = (
  segments: Segment[],
  query: string,
  sort: SegmentListSort = DEFAULT_SEGMENT_LIST_SORT,
): Segment[] => {
  const normalized = query.trim();
  if (!normalized) return sortSegments(segments, sort);

  return [...segments]
    .map((segment) => ({
      segment,
      ...scoreFuzzySearch(segmentSearchFields(segment), normalized),
    }))
    .filter((row) => row.matches)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return compareBySort(a.segment, b.segment, sort);
    })
    .map((row) => row.segment);
};