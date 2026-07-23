import type { SegmentDraft, SegmentPickMode } from "../hooks/segmentEditorTypes";
import { EDITOR_ACTION_TYPES } from "./editorActionTypes";
import type { EditorScreen } from "./editorTypes";

export type EditorAction =
  | { type: typeof EDITOR_ACTION_TYPES.SET_NAME; name: string }
  | {
      type: typeof EDITOR_ACTION_TYPES.SET_PICK_MODE;
      pickMode: SegmentPickMode;
      notice: string;
    }
  | { type: typeof EDITOR_ACTION_TYPES.SET_RADIUS; radius: number }
  | { type: typeof EDITOR_ACTION_TYPES.SET_MATCH_THRESHOLD; matchThreshold: number }
  | { type: typeof EDITOR_ACTION_TYPES.SET_NOTICE; notice: string | null }
  | { type: typeof EDITOR_ACTION_TYPES.SET_ERROR; error: string | null }
  | { type: typeof EDITOR_ACTION_TYPES.CLEAR_DRAFT }
  | { type: typeof EDITOR_ACTION_TYPES.REPLACE_SCREEN; screen: EditorScreen };

export const editorReducer = (state: EditorScreen, action: EditorAction): EditorScreen => {
  switch (action.type) {
    case EDITOR_ACTION_TYPES.SET_NAME:
      return { ...state, name: action.name };

    case EDITOR_ACTION_TYPES.SET_PICK_MODE:
      return { ...state, pickMode: action.pickMode, notice: action.notice };

    case EDITOR_ACTION_TYPES.SET_RADIUS:
      return { ...state, radius: action.radius };

    case EDITOR_ACTION_TYPES.SET_MATCH_THRESHOLD:
      return { ...state, matchThreshold: action.matchThreshold };

    case EDITOR_ACTION_TYPES.SET_NOTICE:
      return { ...state, notice: action.notice };

    case EDITOR_ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.error };

    case EDITOR_ACTION_TYPES.CLEAR_DRAFT:
      return {
        ...state,
        draft: {} as Partial<SegmentDraft>,
        pickMode: "none",
        error: null,
        notice: null,
      };

    case EDITOR_ACTION_TYPES.REPLACE_SCREEN:
      return action.screen;

    default:
      return state;
  }
};