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
  shouldNavigateOnSidebarTabChange,
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

  const navigateWithSearch = useCallback(
    (
      path: string,
      patch: Partial<AppSearchParams>,
      options?: { replace?: boolean },
    ) => {
      // Prefer the browser URL: pass toggles may update via history.replaceState
      // without React Router re-rendering, so RR `search` can lag behind.
      const baseSearch =
        path === pathname
          ? parseAppSearchParams(window.location.search)
          : emptySearchParams();
      const merged = mergeAppSearchParams(baseSearch, patch);
      const nextLocation = parseAppLocation(path);
      const cleaned = cleanSearchForLocation(nextLocation, merged);
      const nextSearch = buildAppSearch(cleaned);
      const browserSearch = window.location.search || "";
      // Skip only when RR and browser already match the target (avoid no-op navigations).
      // If replaceState updated the browser but RR lagged, still navigate to resync RR.
      if (path === pathname && nextSearch === search && nextSearch === browserSearch) return;
      navigate({ pathname: path, search: nextSearch }, options);
    },
    [navigate, pathname, search],
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
      if (!shouldNavigateOnSidebarTabChange(location, tab)) return;
      navigate(listRouteForTab(tab));
    },
    [location, navigate],
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
      (segmentId: number, options?: { replace?: boolean }) => {
        writeLastOpenedSegment(segmentId);
        navigate(appRoutes.segment(segmentId), options);
      },
      [navigate],
    ),
    goCreateSegment: useCallback(
      (activityId: number) => {
        navigate(appRoutes.createSegment(activityId));
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
    openStretchEditView: useCallback(
      () =>
        navigateWithSearch(pathname, {
          view: APP_VIEW.STRETCHES,
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
      (
        selected: ReadonlyArray<number>,
        matchedPassIds: ReadonlyArray<number>,
        defaultIds: ReadonlyArray<number> = matchedPassIds,
      ) =>
        navigateWithSearch(
          pathname,
          {
            comparePasses: serializeComparePassesParam(selected, matchedPassIds, defaultIds),
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