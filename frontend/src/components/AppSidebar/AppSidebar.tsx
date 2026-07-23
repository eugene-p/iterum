import type { ActivitySummary, Segment } from "../../types";
import { ErrorText, Tabs } from "../ui";
import { ActivitiesPanel } from "../activities/ActivitiesPanel";
import { SegmentsPanel } from "../segments/SegmentsPanel";
import { appSidebarStyles } from "./AppSidebar.styles";
import { ProfileSidebarPanel } from "../profiles/ProfileSidebarPanel";
import { PanelLeftCloseIcon, UserIcon } from "./sidebarIcons";

type SidebarTab = "segments" | "activities" | "profile";

type AppSidebarProps = {
  error?: string | null;
  segments: Segment[];
  activities: ActivitySummary[];
  activeTab: SidebarTab;
  selectedSegmentId: number | null;
  selectedActivityId: number | null;
  showCollapse?: boolean;
  onTabChange: (tab: SidebarTab) => void;
  onSelectSegment: (id: number) => void;
  onSelectActivity: (id: number) => void;
  onRefresh: () => Promise<void>;
  onCollapse?: () => void;
};

export const AppSidebar = ({
  error,
  segments,
  activities,
  activeTab,
  selectedSegmentId,
  selectedActivityId,
  showCollapse = false,
  onTabChange,
  onSelectSegment,
  onSelectActivity,
  onRefresh,
  onCollapse,
}: AppSidebarProps) => (
  <aside className={appSidebarStyles.root}>
    <Tabs
      className={appSidebarStyles.tabs}
      value={activeTab}
      onValueChange={onTabChange}
      aria-label="Sidebar sections"
    >
      <div className={appSidebarStyles.tabBarRow}>
        <Tabs.List className={appSidebarStyles.tabBar}>
          <Tabs.Trigger value="segments">Segments</Tabs.Trigger>
          <Tabs.Trigger value="activities">Activities</Tabs.Trigger>
          <Tabs.Trigger value="profile" className={appSidebarStyles.profileTab}>
            <UserIcon className={appSidebarStyles.profileTabIcon} />
            <span className="sr-only">Profile</span>
          </Tabs.Trigger>
        </Tabs.List>
        {showCollapse && onCollapse && (
          <button
            type="button"
            className={appSidebarStyles.collapseButton}
            aria-label="Close sidebar"
            title="Close sidebar"
            onClick={onCollapse}
          >
            <PanelLeftCloseIcon className={appSidebarStyles.collapseIcon} />
          </button>
        )}
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      <div className={appSidebarStyles.tabContent}>
        <Tabs.Panel value="segments" className="flex min-h-0 flex-1 flex-col">
          <SegmentsPanel
            segments={segments}
            selectedSegmentId={selectedSegmentId}
            onSelectSegment={onSelectSegment}
          />
        </Tabs.Panel>
        <Tabs.Panel value="activities" className="flex min-h-0 flex-1 flex-col py-0">
          <ActivitiesPanel
            activities={activities}
            selectedActivityId={selectedActivityId}
            onSelectActivity={onSelectActivity}
            onRefresh={onRefresh}
          />
        </Tabs.Panel>
        <Tabs.Panel value="profile" className="flex min-h-0 flex-1 flex-col py-0">
          <ProfileSidebarPanel />
        </Tabs.Panel>
      </div>
    </Tabs>
  </aside>
);

export type { SidebarTab };