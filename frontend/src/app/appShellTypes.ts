import type { SidebarTab } from "../components/AppSidebar";

export type SidebarLayout = "full" | "rail";

export type AppShellState = {
  sidebarTab: SidebarTab;
  sidebarExpanded: boolean;
  actionError: string | null;
};