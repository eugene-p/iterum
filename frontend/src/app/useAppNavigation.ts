import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SidebarTab } from "../components/AppSidebar";
import {
  writeLastOpenedActivity,
  writeLastOpenedSegment,
} from "../lib/lastOpenedStorage";
import {
  APP_VIEW,
  appRoutes,
  buildAppSearch,
  cleanSearchForLocation,
  compareModeToSearchParam,
  deriveSidebarTab,
  listRouteForTab,
  mergeAppSearchParams,
  parseAppLocation,
  parseAppSearchParams,
  serializeComparePassesParam,
  shouldClearDetailOnSidebarTabChange,
  type AppSearchParams,
  type CompareMode,
} from "./appRoutes";

const emptySearchParams = (): AppSearchParams => ({
  view: null,
  compareMode: null,
  comparePasses: null,
});

export const useAppNavigation = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const location = useMemo(() => parseAppLocation(pathname), [pathname]);
  const searchParams = useMemo(() => parseAppSearchParams(search), [search]);

  const navigateWithSearch = useCallback(
    (
      path: string,
      patch: Partial<AppSearchParams>,
      options?: { replace?: boolean },
    ) => {
      const baseSearch = path === pathname ? searchParams : emptySearchParams();
      const merged = mergeAppSearchParams(baseSearch, patch);
      const nextLocation = parseAppLocation(path);
      const cleaned = cleanSearchForLocation(nextLocation, merged);
      const nextSearch = buildAppSearch(cleaned);
      if (path === pathname && nextSearch === search) return;
      navigate({ pathname: path, search: nextSearch }, options);
    },
    [navigate, pathname, search, searchParams],
  );

  const goHome = useCallback(
    (tab?: SidebarTab) => {
      const resolvedTab = tab ?? deriveSidebarTab(location);
      navigate(listRouteForTab(resolvedTab), { replace: true });
    },
    [location, navigate],
  );

  const setSidebarTab = useCallback(
    (tab: SidebarTab) => {
      if (tab === "profile") return;
      if (shouldClearDetailOnSidebarTabChange(location, tab)) {
        goHome(tab);
        return;
      }
      if (location.type === "list" && location.tab !== tab) {
        navigate(listRouteForTab(tab));
      }
    },
    [goHome, location, navigate],
  );

  return {
    goHome,
    setSidebarTab,
    goActivity: useCallback(
      (activityId: number) => {
        writeLastOpenedActivity(activityId);
        navigate(appRoutes.activity(activityId));
      },
      [navigate],
    ),
    goSegment: useCallback(
      (segmentId: number) => {
        writeLastOpenedSegment(segmentId);
        navigate(appRoutes.segment(segmentId));
      },
      [navigate],
    ),

    openRouteView: useCallback(
      () => navigateWithSearch(pathname, { view: APP_VIEW.ROUTE }),
      [navigateWithSearch, pathname],
    ),
    openCompareView: useCallback(
      () =>
        navigateWithSearch(pathname, {
          view: APP_VIEW.COMPARE,
          compareMode: null,
        }),
      [navigateWithSearch, pathname],
    ),
    setCompareMode: useCallback(
      (compareMode: CompareMode) =>
        navigateWithSearch(
          pathname,
          {
            view: APP_VIEW.COMPARE,
            compareMode: compareModeToSearchParam(compareMode),
          },
          { replace: true },
        ),
      [navigateWithSearch, pathname],
    ),
    setComparePasses: useCallback(
      (selected: ReadonlyArray<number>, matchedPassIds: ReadonlyArray<number>) =>
        navigateWithSearch(
          pathname,
          {
            comparePasses: serializeComparePassesParam(selected, matchedPassIds),
          },
          { replace: true },
        ),
      [navigateWithSearch, pathname],
    ),
    closeView: useCallback(
      () =>
        navigateWithSearch(
          pathname,
          { view: null, compareMode: null },
          { replace: true },
        ),
      [navigateWithSearch, pathname],
    ),
  };
};