import { describe, expect, it } from "vitest";
import { SEGMENT_UI_ACTION_TYPES } from "./segmentUiActionTypes";
import { initialSegmentUiState, segmentUiReducer } from "./segmentUiReducer";
import { DEFAULT_STRETCH_THRESHOLDS } from "../stretchUtils";

describe("segmentUiReducer", () => {
  it("toggles stretch selection", () => {
    const selected = segmentUiReducer(initialSegmentUiState, {
      type: SEGMENT_UI_ACTION_TYPES.TOGGLE_STRETCH,
      stretchIndex: 2,
    });
    expect(selected.stretchIndex).toBe(2);

    const cleared = segmentUiReducer(selected, {
      type: SEGMENT_UI_ACTION_TYPES.TOGGLE_STRETCH,
      stretchIndex: 2,
    });
    expect(cleared.stretchIndex).toBeNull();
  });

  it("clears stretch selection", () => {
    const next = segmentUiReducer(
      { ...initialSegmentUiState, stretchIndex: 3 },
      { type: SEGMENT_UI_ACTION_TYPES.CLEAR_STRETCH_SELECTION },
    );
    expect(next.stretchIndex).toBeNull();
  });

  it("stores stretch preview and clears stretch selection", () => {
    const next = segmentUiReducer(
      { ...initialSegmentUiState, stretchIndex: 1 },
      {
        type: SEGMENT_UI_ACTION_TYPES.SET_STRETCH_PREVIEW,
        thresholds: { ...DEFAULT_STRETCH_THRESHOLDS, min_stretch_m: 99 },
        stretchSourceActivityId: 12,
      },
    );
    expect(next.stretchPreview?.thresholds?.min_stretch_m).toBe(99);
    expect(next.stretchPreview?.stretchSourceActivityId).toBe(12);
    expect(next.stretchIndex).toBeNull();
  });
});