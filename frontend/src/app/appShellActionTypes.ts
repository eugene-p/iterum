import type { SidebarTab } from "../components/AppSidebar";

export const APP_SHELL_ACTION_TYPES = {
  SET_SIDEBAR_TAB: "set-sidebar-tab",
  SET_SIDEBAR_EXPANDED: "set-sidebar-expanded",
  CLEAR_ACTION_ERROR: "clear-action-error",
  SET_ACTION_ERROR: "set-action-error",
} as const;

export type AppShellAction =
  | { type: typeof APP_SHELL_ACTION_TYPES.SET_SIDEBAR_TAB; tab: SidebarTab }
  | { type: typeof APP_SHELL_ACTION_TYPES.SET_SIDEBAR_EXPANDED; expanded: boolean }
  | { type: typeof APP_SHELL_ACTION_TYPES.CLEAR_ACTION_ERROR }
  | { type: typeof APP_SHELL_ACTION_TYPES.SET_ACTION_ERROR; message: string };