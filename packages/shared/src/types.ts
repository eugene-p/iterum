import type { GeoPoint, StretchKind, StretchThresholds } from "./stretch.js";

export type { GeoPoint, StretchKind, StretchThresholds };

export interface TrackPoint {
  lat: number;
  lon: number;
  elevation_m?: number | null;
  heart_rate?: number | null;
  speed_mps?: number | null;
  timestamp?: string | null;
}

export interface Profile {
  id: number;
  name: string;
  year_of_birth: number | null;
  default_stretch_thresholds: StretchThresholds;
  created_at: string;
}

export type ProfileViewScope = number | "all";

export interface ActivitySummary {
  id: number;
  name: string;
  sport?: string | null;
  started_at?: string | null;
  created_at: string;
  duration_sec?: number | null;
  distance_m?: number | null;
  avg_hr?: number | null;
  max_hr?: number | null;
  source_format: string;
  source_filename: string;
  location?: string | null;
  tags?: string[];
  profile_id: number;
  profile_name: string;
  point_count: number;
}

export interface ActivityDetail extends ActivitySummary {
  points: TrackPoint[];
}

export interface Segment {
  id: number;
  name: string;
  description?: string | null;
  source_activity_id: number;
  start_index: number;
  end_index: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  radius_m: number;
  match_threshold: number;
  location?: string | null;
  tags?: string[];
  created_at: string;
  /** Distinct activities with ≥1 match (list payload; scope may filter by profile). */
  match_activity_count?: number;
  /** Distinct matched activities in the last 30 days. */
  matched_last_30d?: number;
  /** Latest activity started_at/created_at among matches. */
  last_matched_at?: string | null;
}

export interface SegmentPass {
  id: number;
  activity_id: number;
  activity_name: string;
  profile_name?: string | null;
  source_filename?: string | null;
  started_at?: string | null;
  created_at?: string | null;
  pass_number: number;
  match_score: number;
  matched: boolean;
  reason?: string | null;
  duration_sec?: number | null;
  distance_m?: number | null;
  avg_speed_kmh?: number | null;
  max_speed_kmh?: number | null;
  avg_hr?: number | null;
  max_hr?: number | null;
  elevation_gain_m?: number | null;
  start_index?: number | null;
  end_index?: number | null;
}

export interface Stretch {
  index: number;
  start: GeoPoint;
  end: GeoPoint;
  length_m: number;
  kind: StretchKind;
  elevation_delta_m: number;
  avg_grade_pct: number;
}

export type StretchState = "saved" | "preview" | "unsaved";

export interface SegmentCompare {
  segment: Segment;
  reference_points: TrackPoint[];
  stretches: Stretch[];
  stretch_thresholds: StretchThresholds;
  stretch_reason?: string | null;
  stretch_source_activity_id?: number | null;
  stretch_state?: StretchState;
  stretch_can_save?: boolean;
  passes: SegmentPass[];
}

export type SegmentStretchPreviewOptions = {
  thresholds?: StretchThresholds;
  stretchSourceActivityId?: number | null;
};

export interface ActivityDeleteInfo {
  segment_count: number;
  segments: Array<{ id: number; name: string }>;
}

export interface ActivityMatchedSegment {
  id: number;
  name: string;
  location?: string | null;
  tags?: string[];
  pass_count: number;
}