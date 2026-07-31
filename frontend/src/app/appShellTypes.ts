import type { SidebarTab } from "../components/AppSidebar";

export type SidebarLayout = "full" | "rail";

export type PendingSelection = {
  kind: "activity" | "segment";
  id: number;
  /** Pathname when selection started; used so list→entity does not clear immediately. */
  fromPathname: string;
};

export type AppShellState = {
  sidebarTab: SidebarTab;
  sidebarExpanded: boolean;
  actionError: string | null;
  pendingSelection: PendingSelection | null;
};
