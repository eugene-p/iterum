import type { StretchThresholds } from "../types";

export const SEGMENT_UI_ACTION_TYPES = {
  RESET: "reset-segment-ui",
  TOGGLE_STRETCH: "toggle-stretch",
  SELECT_STRETCH: "select-stretch",
  CLEAR_STRETCH_SELECTION: "clear-stretch-selection",
  SET_STRETCH_PREVIEW: "set-stretch-preview",
  CLEAR_STRETCH_PREVIEW: "clear-stretch-preview",
} as const;

export type SegmentUiAction =
  | { type: typeof SEGMENT_UI_ACTION_TYPES.RESET }
  | { type: typeof SEGMENT_UI_ACTION_TYPES.TOGGLE_STRETCH; stretchIndex: number }
  | { type: typeof SEGMENT_UI_ACTION_TYPES.SELECT_STRETCH; stretchIndex: number }
  | { type: typeof SEGMENT_UI_ACTION_TYPES.CLEAR_STRETCH_SELECTION }
  | {
      type: typeof SEGMENT_UI_ACTION_TYPES.SET_STRETCH_PREVIEW;
      thresholds?: StretchThresholds;
      stretchSourceActivityId?: number | null;
    }
  | { type: typeof SEGMENT_UI_ACTION_TYPES.CLEAR_STRETCH_PREVIEW };