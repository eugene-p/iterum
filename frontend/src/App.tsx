import { appStyles } from "./App.styles";
import { usePinViewportScroll } from "./hooks/usePinViewportScroll";
import { AppWorkspaceProvider } from "./app/AppWorkspaceContext";
import { ProfileProvider } from "./app/ProfileContext";
import { shouldShowPendingSelection } from "./app/pendingSelection";
import { useAppWorkspace } from "./app/useAppWorkspaceContext";
import { ScreenRouter } from "./app/screens/ScreenRouter";
import { AppSidebar } from "./components/AppSidebar";
import { AppSidebarRail } from "./components/AppSidebar/AppSidebarRail";
import { ScreenPlaceholder } from "./components/ui/ScreenPlaceholder";

const AppLayout = () => {
  const {
    shell,
    location,
    sidebar,
    sidebarError,
    activities,
    segments,
    refreshLists,
    activityJobFailedCount,
    watchActivityJobs,
    navigation,
    pageLayout,
    setSidebarTab,
    expandSidebar,
    collapseSidebar,
    beginPendingSelection,
  } = useAppWorkspace();

  const showRail = sidebar.layout === "rail";
  const showPendingLoader = shouldShowPendingSelection(shell.pendingSelection, location);

  return (
    <div className={appStyles.root}>
      {showRail ? (
        <AppSidebarRail
          activeTab={sidebar.activeTab}
          onTabChange={setSidebarTab}
          onExpand={expandSidebar}
        />
      ) : (
        <AppSidebar
          error={sidebarError}
          segments={segments}
          activities={activities}
          activeTab={sidebar.activeTab}
          selectedSegmentId={sidebar.selectedSegmentId}
          selectedActivityId={sidebar.selectedActivityId}
          activityJobFailedCount={activityJobFailedCount}
          showCollapse={pageLayout !== "empty"}
          onTabChange={setSidebarTab}
          onSelectSegment={(id) => {
            beginPendingSelection({ kind: "segment", id });
            navigation.goSegment(id);
            collapseSidebar();
          }}
          onSelectActivity={(id) => {
            beginPendingSelection({ kind: "activity", id });
            navigation.goActivity(id);
            collapseSidebar();
          }}
          onRefresh={refreshLists}
          onActivityJobsEnqueued={watchActivityJobs}
          onCollapse={collapseSidebar}
        />
      )}

      <main className={appStyles.main}>
        {showPendingLoader ? (
          <ScreenPlaceholder className={appStyles.screenOutlet} />
        ) : (
          <ScreenRouter pageLayout={pageLayout} />
        )}
      </main>
    </div>
  );
};

export const App = () => {
  usePinViewportScroll();
  return (
    <ProfileProvider>
      <AppWorkspaceProvider>
        <AppLayout />
      </AppWorkspaceProvider>
    </ProfileProvider>
  );
};
