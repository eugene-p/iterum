import type { StretchThresholds } from "../types";

/** Keep in sync with server stretchSegmentation DEFAULT_STRETCH_THRESHOLDS */
export const DEFAULT_STRETCH_THRESHOLDS: StretchThresholds = {
  climb_grade_pct: 3,
  descent_grade_pct: -3,
  grade_hysteresis_pct: 1,
  min_stretch_pct: 0.04,
  min_stretch_m: 50,
  max_stretch_pct: 0.2,
  max_stretch_m: 800,
  resample_spacing_m: 10,
  grade_window_m: 30,
};