import type { Segment } from "../types";
import { matchesFuzzySearch, scoreFuzzySearch, type SearchFields } from "./fuzzySearch";

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

export const sortSegmentsByCreated = (segments: Segment[]): Segment[] =>
  [...segments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

export const filterAndSortSegmentsBySearch = (
  segments: Segment[],
  query: string,
): Segment[] => {
  const normalized = query.trim();
  if (!normalized) return sortSegmentsByCreated(segments);

  return [...segments]
    .map((segment) => ({
      segment,
      ...scoreFuzzySearch(segmentSearchFields(segment), normalized),
    }))
    .filter((row) => row.matches)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.segment.created_at).getTime() - new Date(a.segment.created_at).getTime();
    })
    .map((row) => row.segment);
};