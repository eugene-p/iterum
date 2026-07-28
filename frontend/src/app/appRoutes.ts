import type { SidebarTab } from "../components/AppSidebar";

export type AppLocation =
  | { type: "list"; tab: SidebarTab }
  | { type: "activity"; activityId: number }
  | { type: "segment"; segmentId: number };

export const APP_QUERY = {
  VIEW: "view",
  MODE: "mode",
  PASSES: "passes",
} as const;

export const APP_TAB = {
  SEGMENTS: "segments",
  ACTIVITIES: "activities",
  PROFILE: "profile",
} as const;

export const APP_VIEW = {
  ROUTE: "route",
  COMPARE: "compare",
} as const;

/** Segment multi-pass compare modes (activity solo has no mode tabs). */
export const APP_COMPARE_MODE = {
  SEGMENT: "segment",
  STRETCH: "stretch",
} as const;

export type AppView = (typeof APP_VIEW)[keyof typeof APP_VIEW];
export type CompareMode = (typeof APP_COMPARE_MODE)[keyof typeof APP_COMPARE_MODE];

export type AppSearchParams = {
  view: AppView | null;
  compareMode: CompareMode | null;
  /** Null means use the default pass-selection policy (omitted from the URL). */
  comparePasses: ReadonlyArray<number> | null;
};

export const appRoutes = {
  segments: "/segments",
  activities: "/activities",
  activity: (activityId: number) => `/activities/${activityId}`,
  segment: (segmentId: number) => `/segments/${segmentId}`,
  createSegment: (activityId: number) => `/activities/${activityId}/segments/new`,
  editSegment: (segmentId: number) => `/segments/${segmentId}/edit`,
  subsetSegment: (segmentId: number) => `/segments/${segmentId}/subset`,
} as const;

const parseAppView = (value: string | null): AppView | null => {
  if (value === APP_VIEW.ROUTE || value === APP_VIEW.COMPARE) return value;
  return null;
};

/** Normalize URL mode; legacy time/position map to segment. */
const parseCompareMode = (value: string | null): CompareMode | null => {
  if (value === APP_COMPARE_MODE.STRETCH) return APP_COMPARE_MODE.STRETCH;
  if (
    value === APP_COMPARE_MODE.SEGMENT ||
    value === "time" ||
    value === "position"
  ) {
    return APP_COMPARE_MODE.SEGMENT;
  }
  return null;
};

const parsePositiveIntList = (value: string | null): ReadonlyArray<number> | null => {
  if (!value?.trim()) return null;
  const ids = value
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((id) => Number.isFinite(id) && id > 0);
  return ids.length > 0 ? ids : null;
};

export const parseAppSearchParams = (search: string): AppSearchParams => {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    view: parseAppView(params.get(APP_QUERY.VIEW)),
    compareMode: parseCompareMode(params.get(APP_QUERY.MODE)),
    comparePasses: parsePositiveIntList(params.get(APP_QUERY.PASSES)),
  };
};

export const resolveSelectedPassIds = (
  urlPasses: ReadonlyArray<number> | null,
  matchedPassIds: ReadonlyArray<number>,
  defaultIds: ReadonlyArray<number> = matchedPassIds,
): ReadonlyArray<number> => {
  if (!matchedPassIds.length) return [];
  if (!urlPasses?.length) return defaultIds;
  const matched = new Set(matchedPassIds);
  const filtered = urlPasses.filter((id) => matched.has(id));
  return filtered.length > 0 ? filtered : defaultIds;
};

const sameIdSet = (
  a: ReadonlyArray<number>,
  b: ReadonlyArray<number>,
): boolean => {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
};

/** Omit from the URL when selection equals the smart default. */
export const serializeComparePassesParam = (
  selected: ReadonlyArray<number>,
  matchedPassIds: ReadonlyArray<number>,
  defaultIds: ReadonlyArray<number> = matchedPassIds,
): ReadonlyArray<number> | null => {
  if (!matchedPassIds.length) return null;
  const selectedInMatched = matchedPassIds.filter((id) => selected.includes(id));
  if (sameIdSet(selectedInMatched, defaultIds)) return null;
  return selectedInMatched;
};

/** Set whether a matched pass is included. Returns null when excluding the last pass. */
export const setComparePassIncluded = (
  selected: ReadonlyArray<number>,
  matchedPassIds: ReadonlyArray<number>,
  passId: number,
  included: boolean,
): ReadonlyArray<number> | null => {
  const matchedSet = new Set(matchedPassIds);
  if (!matchedSet.has(passId)) return matchedPassIds.filter((id) => selected.includes(id));

  const selectedSet = new Set(selected.filter((id) => matchedSet.has(id)));
  if (included) {
    selectedSet.add(passId);
  } else {
    if (selectedSet.size <= 1 && selectedSet.has(passId)) return null;
    selectedSet.delete(passId);
  }

  const next = matchedPassIds.filter((id) => selectedSet.has(id));
  return next.length > 0 ? next : null;
};

export const toggleComparePassSelection = (
  selected: ReadonlyArray<number>,
  passId: number,
): ReadonlyArray<number> | null => {
  const next = new Set(selected);
  if (next.has(passId)) {
    if (next.size <= 1) return null;
    next.delete(passId);
  } else {
    next.add(passId);
  }
  return [...next];
};

/** Remove a pass from comparison. No-op when already excluded; cannot remove the last pass. */
export const excludeComparePass = (
  selected: ReadonlyArray<number>,
  passId: number,
): ReadonlyArray<number> | null => {
  if (!selected.includes(passId)) return [...selected];
  return toggleComparePassSelection(selected, passId);
};

/** Omit default segment mode from the URL; only stretch is explicit. */
export const compareModeToSearchParam = (mode: CompareMode | null): CompareMode | null =>
  mode === APP_COMPARE_MODE.STRETCH ? APP_COMPARE_MODE.STRETCH : null;

export const buildAppSearch = (params: AppSearchParams): string => {
  const search = new URLSearchParams();
  if (params.view) search.set(APP_QUERY.VIEW, params.view);
  if (params.view === APP_VIEW.COMPARE) {
    const mode = compareModeToSearchParam(params.compareMode);
    if (mode) search.set(APP_QUERY.MODE, mode);
  }
  if (params.comparePasses?.length) {
    search.set(APP_QUERY.PASSES, params.comparePasses.join(","));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
};

/**
 * Update compare-pass selection in the URL without a React Router navigation.
 * Bases on `window.location.search` (not RR props) so successive toggles and later
 * RR navigations that re-read the browser URL keep the latest `passes` value.
 */
export const replaceComparePassesInUrl = (
  pathname: string,
  _currentParams: AppSearchParams,
  location: AppLocation,
  selected: ReadonlyArray<number>,
  matchedPassIds: ReadonlyArray<number>,
  defaultIds: ReadonlyArray<number> = matchedPassIds,
): void => {
  const browserParams = parseAppSearchParams(window.location.search);
  const merged = mergeAppSearchParams(browserParams, {
    comparePasses: serializeComparePassesParam(selected, matchedPassIds, defaultIds),
  });
  const cleaned = cleanSearchForLocation(location, merged);
  const nextUrl = `${pathname}${buildAppSearch(cleaned)}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
};

export const mergeAppSearchParams = (
  current: AppSearchParams,
  patch: Partial<AppSearchParams>,
): AppSearchParams => ({
  view: patch.view !== undefined ? patch.view : current.view,
  compareMode: patch.compareMode !== undefined ? patch.compareMode : current.compareMode,
  comparePasses: patch.comparePasses !== undefined ? patch.comparePasses : current.comparePasses,
});

export type ResolveCompareModeOptions = {
  segmentTimeAvailable?: boolean;
  stretchTimeAvailable?: boolean;
};

/**
 * Resolve active compare mode for segment multi-pass.
 * Default is Segment time. Stretch only when requested and available.
 */
export const resolveCompareMode = (
  params: AppSearchParams,
  options: ResolveCompareModeOptions | boolean = true,
): CompareMode => {
  const opts: ResolveCompareModeOptions =
    typeof options === "boolean"
      ? { segmentTimeAvailable: options, stretchTimeAvailable: options }
      : options;
  const segmentOk = opts.segmentTimeAvailable !== false;
  const stretchOk = opts.stretchTimeAvailable === true;

  if (params.view !== APP_VIEW.COMPARE) {
    return APP_COMPARE_MODE.SEGMENT;
  }

  if (params.compareMode === APP_COMPARE_MODE.STRETCH && stretchOk) {
    return APP_COMPARE_MODE.STRETCH;
  }

  if (segmentOk) return APP_COMPARE_MODE.SEGMENT;
  if (stretchOk) return APP_COMPARE_MODE.STRETCH;
  return APP_COMPARE_MODE.SEGMENT;
};

export const cleanSearchForLocation = (
  location: AppLocation,
  params: AppSearchParams,
): AppSearchParams => {
  if (location.type !== "activity" && location.type !== "segment") {
    return { view: null, compareMode: null, comparePasses: null };
  }
  if (location.type === "activity") {
    if (params.view === APP_VIEW.ROUTE) {
      return { view: params.view, compareMode: null, comparePasses: null };
    }
    return { view: null, compareMode: null, comparePasses: null };
  }
  if (params.view === APP_VIEW.COMPARE) {
    return params;
  }
  return { view: null, compareMode: null, comparePasses: params.comparePasses };
};

export const isViewValidForLocation = (
  location: AppLocation,
  view: AppView | null,
): boolean => {
  if (!view) return true;
  if (view === APP_VIEW.ROUTE) return location.type === "activity";
  if (view === APP_VIEW.COMPARE) return location.type === "segment";
  return false;
};

const parsePositiveInt = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const listRouteForTab = (tab: SidebarTab): string => {
  if (tab === APP_TAB.ACTIVITIES) return appRoutes.activities;
  if (tab === APP_TAB.SEGMENTS) return appRoutes.segments;
  return appRoutes.segments;
};

export const parseAppLocation = (pathname: string): AppLocation => {
  const createMatch = pathname.match(/^\/activities\/(\d+)\/segments\/new$/);
  const createActivityId = parsePositiveInt(createMatch?.[1]);
  if (createActivityId != null) {
    return { type: "activity", activityId: createActivityId };
  }

  const legacySegmentMatch = pathname.match(/^\/segments\/(\d+)\/(?:edit|subset)$/);
  const legacySegmentId = parsePositiveInt(legacySegmentMatch?.[1]);
  if (legacySegmentId != null) {
    return { type: "segment", segmentId: legacySegmentId };
  }

  const activityMatch = pathname.match(/^\/activities\/(\d+)$/);
  const detailActivityId = parsePositiveInt(activityMatch?.[1]);
  if (detailActivityId != null) {
    return { type: "activity", activityId: detailActivityId };
  }

  const segmentMatch = pathname.match(/^\/segments\/(\d+)$/);
  const detailSegmentId = parsePositiveInt(segmentMatch?.[1]);
  if (detailSegmentId != null) {
    return { type: "segment", segmentId: detailSegmentId };
  }

  if (pathname === appRoutes.activities) {
    return { type: "list", tab: APP_TAB.ACTIVITIES };
  }

  return { type: "list", tab: APP_TAB.SEGMENTS };
};

export const deriveSidebarTab = (
  location: AppLocation,
  fallback: SidebarTab = APP_TAB.SEGMENTS,
): SidebarTab => {
  if (location.type === "list") return location.tab;
  if (location.type === "activity") return APP_TAB.ACTIVITIES;
  if (location.type === "segment") return APP_TAB.SEGMENTS;
  return fallback;
};

/** Sync sidebar tab when route changes; preserves explicit tab choice on list routes. */
export const syncSidebarTabFromLocation = (
  location: AppLocation,
  currentTab: SidebarTab,
): SidebarTab => {
  if (location.type === "list") return location.tab;
  return deriveSidebarTab(location, currentTab);
};

/**
 * Whether a sidebar list tab change should navigate to that list route.
 * Profile is handled by the shell only. On detail/create workspaces, tab changes
 * only switch which sidebar list is shown — the open entity stays mounted.
 */
export const shouldNavigateOnSidebarTabChange = (
  location: AppLocation,
  nextTab: SidebarTab,
): boolean => {
  if (nextTab === APP_TAB.PROFILE) return false;
  if (location.type !== "list") return false;
  return location.tab !== nextTab;
};

export const selectedActivityIdFromLocation = (location: AppLocation): number | null =>
  location.type === "activity" ? location.activityId : null;

export const selectedSegmentIdFromLocation = (location: AppLocation): number | null =>
  location.type === "segment" ? location.segmentId : null;

export const isListLocation = (location: AppLocation): boolean => location.type === "list";

export type EntityListsState = {
  activitiesLoaded: boolean;
  segmentsLoaded: boolean;
  activities: ReadonlyArray<{ id: number }>;
  segments: ReadonlyArray<{ id: number }>;
};

/** Redirect unknown detail routes only after the corresponding list has loaded. */
export const shouldRedirectUnknownEntity = (
  location: AppLocation,
  lists: EntityListsState,
): boolean => {
  if (location.type === "activity") {
    if (!lists.activitiesLoaded) return false;
    return !lists.activities.some((activity) => activity.id === location.activityId);
  }
  if (location.type === "segment") {
    if (!lists.segmentsLoaded) return false;
    return !lists.segments.some((segment) => segment.id === location.segmentId);
  }
  return false;
};
