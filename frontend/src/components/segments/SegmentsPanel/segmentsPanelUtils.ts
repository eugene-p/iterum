import { formatRelativePast } from "../../../lib/formatRelativePast";
import { formatTags } from "../../../lib/formatTags";
import {
  DEFAULT_SEGMENT_LIST_SORT,
  filterAndSortSegmentsBySearch,
  matchesSegmentSearch,
  SEGMENT_LIST_SORT_OPTIONS,
  sortSegments,
  sortSegmentsByCreated,
  type SegmentListSort,
} from "../../../lib/segmentSearch";
import type { Segment } from "../../../types";

export {
  DEFAULT_SEGMENT_LIST_SORT,
  filterAndSortSegmentsBySearch,
  matchesSegmentSearch,
  SEGMENT_LIST_SORT_OPTIONS,
  sortSegments,
  sortSegmentsByCreated,
  type SegmentListSort,
};

/** Compact label for the collapsed search/sort control. */
export const segmentFiltersSummary = (
  sort: SegmentListSort,
  searchQuery: string,
): string => {
  const sortLabel =
    SEGMENT_LIST_SORT_OPTIONS.find((option) => option.value === sort)?.label ??
    "Last matched";
  const query = searchQuery.trim();
  if (!query) return sortLabel;
  return `${sortLabel} · “${query}”`;
};

export const segmentFiltersAreActive = (
  sort: SegmentListSort,
  searchQuery: string,
): boolean =>
  searchQuery.trim().length > 0 || sort !== DEFAULT_SEGMENT_LIST_SORT;

/** Primary list meta: match signal only (always lead the row). */
export const segmentMatchMetaLine = (
  segment: Segment,
  now: Date = new Date(),
): string => {
  const matchCount = segment.match_activity_count ?? 0;
  if (matchCount <= 0) return "No matches yet";

  const parts: string[] = [
    `${matchCount} ${matchCount === 1 ? "activity" : "activities"}`,
  ];

  const recent = segment.matched_last_30d ?? 0;
  if (recent > 0) parts.push(`${recent} in last 30d`);

  if (segment.last_matched_at) {
    const relative = formatRelativePast(segment.last_matched_at, now);
    if (relative) parts.push(`last ${relative}`);
  }

  return parts.join(" · ");
};

/** Secondary context: tags / location (may truncate). */
export const segmentContextMetaLine = (segment: Segment): string | null => {
  const parts: string[] = [];
  const tagLine = formatTags(segment.tags);
  if (tagLine) parts.push(tagLine);
  if (segment.location) parts.push(segment.location);
  return parts.length > 0 ? parts.join(" · ") : null;
};

/** Combined meta for tests / callers that want one string (match first). */
export const segmentMetaLine = (segment: Segment, now: Date = new Date()): string => {
  const parts = [segmentMatchMetaLine(segment, now)];
  const context = segmentContextMetaLine(segment);
  if (context) parts.push(context);
  return parts.join(" · ");
};
