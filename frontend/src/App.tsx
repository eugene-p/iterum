import { appStyles } from "./App.styles";
import { usePinViewportScroll } from "./hooks/usePinViewportScroll";
import { isListLocation } from "./app/appRoutes";
import { AppWorkspaceProvider } from "./app/AppWorkspaceContext";
import { ProfileProvider, useProfileContext } from "./app/ProfileContext";
import { useAppWorkspace } from "./app/useAppWorkspaceContext";
import { ScreenRouter } from "./app/screens/ScreenRouter";
import { AppSidebar } from "./components/AppSidebar";
import { AppSidebarRail } from "./components/AppSidebar/AppSidebarRail";
import { ProfileSelectScreen } from "./components/profiles/ProfileSelectScreen";

const AppLayout = () => {
  const {
    location,
    sidebar,
    sidebarError,
    activities,
    segments,
    refreshLists,
    navigation,
    setSidebarTab,
    expandSidebar,
    collapseSidebar,
  } = useAppWorkspace();

  const showRail = sidebar.layout === "rail";

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
          showCollapse={!isListLocation(location)}
          onTabChange={setSidebarTab}
          onSelectSegment={(id) => {
            navigation.goSegment(id);
            collapseSidebar();
          }}
          onSelectActivity={(id) => {
            navigation.goActivity(id);
            collapseSidebar();
          }}
          onRefresh={refreshLists}
          onCollapse={collapseSidebar}
        />
      )}

      <main className={appStyles.main}>
        <ScreenRouter />
      </main>
    </div>
  );
};

const AppGate = () => {
  const { activeProfileId } = useProfileContext();
  if (activeProfileId == null) return <ProfileSelectScreen />;
  return (
    <AppWorkspaceProvider>
      <AppLayout />
    </AppWorkspaceProvider>
  );
};

export const App = () => {
  usePinViewportScroll();
  return (
    <ProfileProvider>
      <AppGate />
    </ProfileProvider>
  );
};