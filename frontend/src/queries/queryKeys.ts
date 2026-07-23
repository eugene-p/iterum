import type { SegmentStretchPreviewOptions } from "../types";
import { stretchPreviewQuery } from "../stretchUtils";

export const queryKeys = {
  profiles: ["profiles"] as const,
  profile: (id: number) => ["profile", id] as const,
  activities: (profileScope?: number | "all") =>
    ["activities", profileScope ?? "default"] as const,
  activity: (id: number) => ["activity", id] as const,
  activitySummary: (id: number) => ["activity-summary", id] as const,
  activityPoints: (id: number) => ["activity-points", id] as const,
  activityRouteSample: (id: number) => ["activity-route-sample", id] as const,
  activityDeleteInfo: (id: number) => ["activity-delete-info", id] as const,
  activityMatchedSegments: (id: number) => ["activity-matched-segments", id] as const,
  segmentReference: (id: number) => ["segment-reference", id] as const,
  segments: ["segments"] as const,
  segmentCompare: (segmentId: number, preview: SegmentStretchPreviewOptions | null) =>
    ["segment-compare", segmentId, preview ? stretchPreviewQuery(preview) : "saved"] as const,
  segmentCompareRoot: (segmentId: number) => ["segment-compare", segmentId] as const,
} as const;