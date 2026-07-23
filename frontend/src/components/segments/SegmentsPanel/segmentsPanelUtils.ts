import { formatTags } from "../../../lib/formatTags";
import type { Segment } from "../../../types";

export {
  filterAndSortSegmentsBySearch,
  matchesSegmentSearch,
  sortSegmentsByCreated,
} from "../../../lib/segmentSearch";

export const segmentMetaLine = (segment: Segment): string => {
  const parts: string[] = [];
  const tagLine = formatTags(segment.tags);
  if (tagLine) parts.push(tagLine);
  if (segment.location) parts.push(segment.location);
  parts.push(`${Math.round(segment.match_threshold * 100)}% threshold`);
  parts.push(`${segment.radius_m} m radius`);
  return parts.join(" · ");
};

