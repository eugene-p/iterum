import { APP_SHELL_ACTION_TYPES, type AppShellAction } from "./appShellActionTypes";
import type { AppShellState } from "./appShellTypes";

export const initialAppShellState: AppShellState = {
  sidebarTab: "segments",
  sidebarExpanded: false,
  actionError: null,
};

export const appShellReducer = (state: AppShellState, action: AppShellAction): AppShellState => {
  switch (action.type) {
    case APP_SHELL_ACTION_TYPES.SET_SIDEBAR_TAB:
      return { ...state, sidebarTab: action.tab };

    case APP_SHELL_ACTION_TYPES.SET_SIDEBAR_EXPANDED:
      return { ...state, sidebarExpanded: action.expanded };

    case APP_SHELL_ACTION_TYPES.CLEAR_ACTION_ERROR:
      return { ...state, actionError: null };

    case APP_SHELL_ACTION_TYPES.SET_ACTION_ERROR:
      return { ...state, actionError: action.message };

    default:
      return state;
  }
};