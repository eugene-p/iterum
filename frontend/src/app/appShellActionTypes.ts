import type { SidebarTab } from "../components/AppSidebar";
import type { PendingSelection } from "./appShellTypes";

export const APP_SHELL_ACTION_TYPES = {
  SET_SIDEBAR_TAB: "set-sidebar-tab",
  SET_SIDEBAR_EXPANDED: "set-sidebar-expanded",
  CLEAR_ACTION_ERROR: "clear-action-error",
  SET_ACTION_ERROR: "set-action-error",
  SET_PENDING_SELECTION: "set-pending-selection",
  CLEAR_PENDING_SELECTION: "clear-pending-selection",
} as const;

export type AppShellAction =
  | { type: typeof APP_SHELL_ACTION_TYPES.SET_SIDEBAR_TAB; tab: SidebarTab }
  | { type: typeof APP_SHELL_ACTION_TYPES.SET_SIDEBAR_EXPANDED; expanded: boolean }
  | { type: typeof APP_SHELL_ACTION_TYPES.CLEAR_ACTION_ERROR }
  | { type: typeof APP_SHELL_ACTION_TYPES.SET_ACTION_ERROR; message: string }
  | {
      type: typeof APP_SHELL_ACTION_TYPES.SET_PENDING_SELECTION;
      pending: PendingSelection;
    }
  | { type: typeof APP_SHELL_ACTION_TYPES.CLEAR_PENDING_SELECTION };
