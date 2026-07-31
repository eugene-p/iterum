import type { SidebarTab } from "../components/AppSidebar";
import type { SegmentPickMode } from "../hooks/segmentEditorTypes";
import type { StretchThresholds } from "../types";
import { APP_SHELL_ACTION_TYPES } from "./appShellActionTypes";
import type { AppShellAction } from "./appShellActionTypes";
import type { PendingSelection } from "./appShellTypes";
import { EDITOR_ACTION_TYPES } from "./editorActionTypes";
import type { EditorAction } from "./editorReducer";
import type { EditorScreen } from "./editorTypes";
import { SEGMENT_UI_ACTION_TYPES } from "./segmentUiActionTypes";
import type { SegmentUiAction } from "./segmentUiActionTypes";

export const shellActions = {
  setSidebarTab: (tab: SidebarTab): AppShellAction => ({
    type: APP_SHELL_ACTION_TYPES.SET_SIDEBAR_TAB,
    tab,
  }),
  setSidebarExpanded: (expanded: boolean): AppShellAction => ({
    type: APP_SHELL_ACTION_TYPES.SET_SIDEBAR_EXPANDED,
    expanded,
  }),
  clearActionError: (): AppShellAction => ({ type: APP_SHELL_ACTION_TYPES.CLEAR_ACTION_ERROR }),
  setActionError: (message: string): AppShellAction => ({
    type: APP_SHELL_ACTION_TYPES.SET_ACTION_ERROR,
    message,
  }),
  setPendingSelection: (pending: PendingSelection): AppShellAction => ({
    type: APP_SHELL_ACTION_TYPES.SET_PENDING_SELECTION,
    pending,
  }),
  clearPendingSelection: (): AppShellAction => ({
    type: APP_SHELL_ACTION_TYPES.CLEAR_PENDING_SELECTION,
  }),
};

export const editorActions = {
  setName: (name: string): EditorAction => ({ type: EDITOR_ACTION_TYPES.SET_NAME, name }),
  setPickMode: (pickMode: SegmentPickMode, notice: string): EditorAction => ({
    type: EDITOR_ACTION_TYPES.SET_PICK_MODE,
    pickMode,
    notice,
  }),
  setRadius: (radius: number): EditorAction => ({
    type: EDITOR_ACTION_TYPES.SET_RADIUS,
    radius,
  }),
  setMatchThreshold: (matchThreshold: number): EditorAction => ({
    type: EDITOR_ACTION_TYPES.SET_MATCH_THRESHOLD,
    matchThreshold,
  }),
  setNotice: (notice: string | null): EditorAction => ({
    type: EDITOR_ACTION_TYPES.SET_NOTICE,
    notice,
  }),
  setError: (error: string | null): EditorAction => ({
    type: EDITOR_ACTION_TYPES.SET_ERROR,
    error,
  }),
  clearDraft: (): EditorAction => ({ type: EDITOR_ACTION_TYPES.CLEAR_DRAFT }),
  replaceScreen: (screen: EditorScreen): EditorAction => ({
    type: EDITOR_ACTION_TYPES.REPLACE_SCREEN,
    screen,
  }),
};

export const segmentUiActions = {
  toggleStretch: (stretchIndex: number): SegmentUiAction => ({
    type: SEGMENT_UI_ACTION_TYPES.TOGGLE_STRETCH,
    stretchIndex,
  }),
  selectStretch: (stretchIndex: number): SegmentUiAction => ({
    type: SEGMENT_UI_ACTION_TYPES.SELECT_STRETCH,
    stretchIndex,
  }),
  clearStretchSelection: (): SegmentUiAction => ({
    type: SEGMENT_UI_ACTION_TYPES.CLEAR_STRETCH_SELECTION,
  }),
  setStretchPreview: (
    thresholds?: StretchThresholds,
    stretchSourceActivityId?: number | null,
  ): SegmentUiAction => ({
    type: SEGMENT_UI_ACTION_TYPES.SET_STRETCH_PREVIEW,
    thresholds,
    stretchSourceActivityId,
  }),
  clearStretchPreview: (): SegmentUiAction => ({
    type: SEGMENT_UI_ACTION_TYPES.CLEAR_STRETCH_PREVIEW,
  }),
};