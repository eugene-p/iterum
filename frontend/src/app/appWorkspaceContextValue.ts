import type { SidebarTab } from "../components/AppSidebar";
import type { ActivitySummary, Segment } from "../types";
import type { AppLocation } from "./appRoutes";
import type { AppShellAction } from "./appShellActionTypes";
import type { AppShellState, SidebarLayout } from "./appShellTypes";
import type { useAppNavigation } from "./useAppNavigation";
import type { PageLayout } from "./pageLayout";

export type AppNavigation = ReturnType<typeof useAppNavigation>;

export type AppWorkspaceValue = {
  shell: AppShellState;
  dispatch: React.Dispatch<AppShellAction>;
  navigation: AppNavigation;
  location: AppLocation;
  pageLayout: PageLayout;
  activities: ActivitySummary[];
  segments: Segment[];
  sidebar: {
    activeTab: SidebarTab;
    selectedActivityId: number | null;
    selectedSegmentId: number | null;
    layout: SidebarLayout;
  };
  sidebarError: string | null;
  refreshLists: () => Promise<void>;
  setSidebarTab: (tab: SidebarTab) => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
  toggleSidebarExpanded: () => void;
};
