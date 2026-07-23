export const STRETCH_THRESHOLDS_SECTION_HINT =
  "Defaults used when generating climb, flat, and descent stretches for segments in this profile. Save the profile to keep changes.";

export const STRETCH_THRESHOLD_GROUP_TITLES = {
  grade: "Grade",
  stretchLength: "Stretch length",
  sampling: "Route sampling",
} as const;

export const STRETCH_THRESHOLD_FIELD_HINTS = {
  climb_grade_pct: "Minimum average grade (%) for a section to count as a climb.",
  descent_grade_pct:
    "Maximum average grade (%) for a section to count as a descent (typically negative).",
  grade_hysteresis_pct:
    "Grade buffer (%) when switching between climb, flat, and descent to reduce flicker.",
  min_stretch_pct:
    "Shortest stretch as a percent of segment length; shorter sections are merged away.",
  min_stretch_m: "Shortest stretch in meters; shorter sections are merged away.",
  max_stretch_pct: "Longest stretch as a percent of segment length before splitting.",
  max_stretch_m: "Longest stretch in meters before splitting.",
  resample_spacing_m:
    "Spacing between elevation samples along the route when computing grade.",
  grade_window_m: "Distance in meters over which elevation change is averaged for grade.",
} as const;