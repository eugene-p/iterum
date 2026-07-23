import { cn } from "../../lib/cn";
import type { SidebarTab } from "./AppSidebar";
import { appSidebarRailStyles } from "./AppSidebarRail.styles";
import { ActivitiesIcon, PanelLeftOpenIcon, SegmentsIcon, UserIcon } from "./sidebarIcons";

type AppSidebarRailProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onExpand: () => void;
};

const railTabs: ReadonlyArray<{ tab: SidebarTab; label: string; Icon: typeof SegmentsIcon }> = [
  { tab: "segments", label: "Segments", Icon: SegmentsIcon },
  { tab: "activities", label: "Activities", Icon: ActivitiesIcon },
  { tab: "profile", label: "Profile", Icon: UserIcon },
];

export const AppSidebarRail = ({ activeTab, onTabChange, onExpand }: AppSidebarRailProps) => {
  const selectTab = (tab: SidebarTab) => {
    onTabChange(tab);
    onExpand();
  };

  return (
    <aside className={appSidebarRailStyles.root} aria-label="Sidebar navigation">
      <button
        type="button"
        className={appSidebarRailStyles.tab}
        aria-label="Open sidebar"
        title="Open sidebar"
        onClick={onExpand}
      >
        <PanelLeftOpenIcon />
      </button>

      <div className={appSidebarRailStyles.divider} aria-hidden />

      {railTabs.map(({ tab, label, Icon }) => (
        <button
          key={tab}
          type="button"
          className={cn(
            appSidebarRailStyles.tab,
            activeTab === tab && appSidebarRailStyles.tabActive,
          )}
          aria-label={label}
          aria-current={activeTab === tab ? "page" : undefined}
          title={label}
          onClick={() => selectTab(tab)}
        >
          <Icon />
        </button>
      ))}
    </aside>
  );
};