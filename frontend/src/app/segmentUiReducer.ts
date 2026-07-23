import type { SegmentStretchPreviewOptions } from "../types";
import { SEGMENT_UI_ACTION_TYPES, type SegmentUiAction } from "./segmentUiActionTypes";

export type SegmentUiState = {
  stretchIndex: number | null;
  stretchPreview: SegmentStretchPreviewOptions | null;
};

export const initialSegmentUiState: SegmentUiState = {
  stretchIndex: null,
  stretchPreview: null,
};

export const segmentUiReducer = (
  state: SegmentUiState,
  action: SegmentUiAction,
): SegmentUiState => {
  switch (action.type) {
    case SEGMENT_UI_ACTION_TYPES.RESET:
      return initialSegmentUiState;

    case SEGMENT_UI_ACTION_TYPES.TOGGLE_STRETCH:
      return {
        ...state,
        stretchIndex: state.stretchIndex === action.stretchIndex ? null : action.stretchIndex,
      };

    case SEGMENT_UI_ACTION_TYPES.CLEAR_STRETCH_SELECTION:
      return {
        ...state,
        stretchIndex: null,
      };

    case SEGMENT_UI_ACTION_TYPES.SET_STRETCH_PREVIEW:
      return {
        ...state,
        stretchPreview: {
          thresholds: action.thresholds ?? state.stretchPreview?.thresholds,
          stretchSourceActivityId:
            action.stretchSourceActivityId !== undefined
              ? action.stretchSourceActivityId
              : state.stretchPreview?.stretchSourceActivityId,
        },
        stretchIndex: null,
      };

    case SEGMENT_UI_ACTION_TYPES.CLEAR_STRETCH_PREVIEW:
      return {
        ...state,
        stretchPreview: null,
        stretchIndex: null,
      };

    default:
      return state;
  }
};