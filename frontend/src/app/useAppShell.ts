import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useProfileContext } from "./ProfileContext";
import {
  useActivitiesQuery,
  useInvalidateActivities,
} from "../queries/activities";
import {
  useInvalidateSegments,
  useSegmentsQuery,
} from "../queries/segments";
import type { SidebarTab } from "../components/AppSidebar";
import { appShellReducer, initialAppShellState } from "./appShellReducer";
import {
  deriveSidebarTab,
  isListLocation,
  parseAppLocation,
  selectedActivityIdFromLocation,
  selectedSegmentIdFromLocation,
  shouldRedirectUnknownEntity,
} from "./appRoutes";
import { shellActions } from "./appActions";
import { useAppNavigation } from "./useAppNavigation";
import type { SidebarLayout } from "./appShellTypes";

const queryErrorMessage = (error: unknown): string | null => {
  if (!error) return null;
  return error instanceof Error ? error.message : String(error);
};

export const useAppShell = () => {
  const [shell, dispatch] = useReducer(appShellReducer, initialAppShellState);
  const { pathname } = useLocation();
  const navigation = useAppNavigation();
  const previousLocationRef = useRef(parseAppLocation(pathname));
  const { viewScope } = useProfileContext();

  const activitiesQuery = useActivitiesQuery(viewScope ?? undefined);
  const segmentsQuery = useSegmentsQuery();
  const invalidateActivities = useInvalidateActivities();
  const invalidateSegments = useInvalidateSegments();

  const activities = useMemo(() => activitiesQuery.data ?? [], [activitiesQuery.data]);
  const segments = useMemo(() => segmentsQuery.data ?? [], [segmentsQuery.data]);
  const location = useMemo(() => parseAppLocation(pathname), [pathname]);

  useEffect(() => {
    if (
      shouldRedirectUnknownEntity(location, {
        activitiesLoaded: activitiesQuery.isSuccess,
        segmentsLoaded: segmentsQuery.isSuccess,
        activities,
        segments,
      })
    ) {
      navigation.goHome();
    }
  }, [
    activities,
    activitiesQuery.isSuccess,
    location,
    navigation,
    segments,
    segmentsQuery.isSuccess,
  ]);

  useEffect(() => {
    const previousLocation = previousLocationRef.current;
    if (isListLocation(previousLocation) && !isListLocation(location)) {
      dispatch(shellActions.setSidebarExpanded(false));
    }
    dispatch(shellActions.setSidebarTab(deriveSidebarTab(location)));
    previousLocationRef.current = location;
  }, [location]);

  const sidebarLayout: SidebarLayout = useMemo(() => {
    if (isListLocation(location)) return "full";
    return shell.sidebarExpanded ? "full" : "rail";
  }, [location, shell.sidebarExpanded]);

  const sidebar = useMemo(
    () => ({
      activeTab:
        shell.sidebarTab === "profile"
          ? "profile"
          : location.type === "list"
            ? location.tab
            : shell.sidebarExpanded
              ? shell.sidebarTab
              : deriveSidebarTab(location),
      selectedActivityId: selectedActivityIdFromLocation(location),
      selectedSegmentId: selectedSegmentIdFromLocation(location),
      layout: sidebarLayout,
    }),
    [location, shell.sidebarExpanded, shell.sidebarTab, sidebarLayout],
  );

  const sidebarError =
    shell.actionError ??
    queryErrorMessage(activitiesQuery.error) ??
    queryErrorMessage(segmentsQuery.error);

  const refreshLists = async () => {
    await Promise.all([invalidateActivities(), invalidateSegments()]);
  };

  const setSidebarTab = useCallback(
    (tab: SidebarTab) => {
      dispatch(shellActions.setSidebarTab(tab));
      if (tab !== "profile") {
        navigation.setSidebarTab(tab);
      }
    },
    [dispatch, navigation],
  );

  const expandSidebar = useCallback(() => {
    dispatch(shellActions.setSidebarExpanded(true));
  }, [dispatch]);

  const collapseSidebar = useCallback(() => {
    dispatch(shellActions.setSidebarExpanded(false));
  }, [dispatch]);

  const toggleSidebarExpanded = useCallback(() => {
    dispatch(shellActions.setSidebarExpanded(!shell.sidebarExpanded));
  }, [dispatch, shell.sidebarExpanded]);

  return {
    shell,
    dispatch,
    navigation,
    location,
    activities,
    segments,
    sidebar,
    sidebarError,
    refreshLists,
    setSidebarTab,
    expandSidebar,
    collapseSidebar,
    toggleSidebarExpanded,
  };
};