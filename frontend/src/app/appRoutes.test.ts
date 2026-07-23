import { describe, expect, it } from "vitest";
import {
  APP_COMPARE_MODE,
  APP_VIEW,
  appRoutes,
  buildAppSearch,
  compareModeToSearchParam,
  deriveSidebarTab,
  isListLocation,
  isViewValidForLocation,
  mergeAppSearchParams,
  parseAppLocation,
  parseAppSearchParams,
  resolveCompareMode,
  resolveSelectedPassIds,
  selectedActivityIdFromLocation,
  serializeComparePassesParam,
  excludeComparePass,
  setComparePassIncluded,
  toggleComparePassSelection,
  selectedSegmentIdFromLocation,
  shouldClearDetailOnSidebarTabChange,
  shouldRedirectUnknownEntity,
  syncSidebarTabFromLocation,
} from "./appRoutes";

const ACTIVITIES_PATH = "/activities";
const SEGMENTS_PATH = "/segments";
const ACTIVITY_PATH = "/activities/1";
const ACTIVITY_5_PATH = "/activities/5";
const SEGMENT_PATH = "/segments/2";
const SEGMENT_39_PATH = "/segments/39";
const CREATE_SEGMENT_PATH = "/activities/10/segments/new";
const EDIT_SEGMENT_PATH = "/segments/3/edit";

describe("appRoutes", () => {
  it("builds canonical paths", () => {
    expect(appRoutes.segments).toBe(SEGMENTS_PATH);
    expect(appRoutes.activities).toBe(ACTIVITIES_PATH);
    expect(appRoutes.activity(42)).toBe("/activities/42");
    expect(appRoutes.segment(7)).toBe("/segments/7");
    expect(appRoutes.createSegment(10)).toBe(CREATE_SEGMENT_PATH);
    expect(appRoutes.editSegment(3)).toBe(EDIT_SEGMENT_PATH);
    expect(appRoutes.subsetSegment(3)).toBe("/segments/3/subset");
  });

  it("parses list, activity, and segment routes", () => {
    expect(parseAppLocation(SEGMENTS_PATH)).toEqual({ type: "list", tab: "segments" });
    expect(parseAppLocation(ACTIVITIES_PATH)).toEqual({ type: "list", tab: "activities" });
    expect(parseAppLocation("/")).toEqual({ type: "list", tab: "segments" });
    expect(parseAppLocation("/activities/42")).toEqual({
      type: "activity",
      activityId: 42,
    });
    expect(parseAppLocation("/segments/7")).toEqual({
      type: "segment",
      segmentId: 7,
    });
  });

  it("parses legacy editor routes as their parent detail routes", () => {
    expect(parseAppLocation(CREATE_SEGMENT_PATH)).toEqual({
      type: "activity",
      activityId: 10,
    });
    expect(parseAppLocation(EDIT_SEGMENT_PATH)).toEqual({
      type: "segment",
      segmentId: 3,
    });
    expect(parseAppLocation("/segments/3/subset")).toEqual({
      type: "segment",
      segmentId: 3,
    });
  });

  it("parses and builds search params for modal view", () => {
    const emptyParams = { view: null, compareMode: null, comparePasses: null };

    expect(parseAppSearchParams("")).toEqual(emptyParams);
    expect(parseAppSearchParams("?view=route")).toEqual({ ...emptyParams, view: "route" });
    expect(parseAppSearchParams("?view=invalid")).toEqual(emptyParams);
    expect(parseAppSearchParams("?view=compare&mode=time")).toEqual({
      view: "compare",
      compareMode: "segment",
      comparePasses: null,
    });
    expect(parseAppSearchParams("?view=compare&mode=position")).toEqual({
      view: "compare",
      compareMode: "segment",
      comparePasses: null,
    });
    expect(parseAppSearchParams("?view=compare&mode=segment")).toEqual({
      view: "compare",
      compareMode: "segment",
      comparePasses: null,
    });
    expect(parseAppSearchParams("?view=compare&mode=stretch")).toEqual({
      view: "compare",
      compareMode: "stretch",
      comparePasses: null,
    });
    expect(parseAppSearchParams("?view=compare&passes=3,1,9")).toEqual({
      view: "compare",
      compareMode: null,
      comparePasses: [3, 1, 9],
    });
    expect(parseAppSearchParams("?view=compare&passes=bad,0")).toEqual({
      view: "compare",
      compareMode: null,
      comparePasses: null,
    });

    expect(buildAppSearch(emptyParams)).toBe("");
    expect(buildAppSearch({ view: "compare", compareMode: null, comparePasses: null })).toBe(
      "?view=compare",
    );
    expect(buildAppSearch({ view: "compare", compareMode: "segment", comparePasses: null })).toBe(
      "?view=compare",
    );
    expect(buildAppSearch({ view: "compare", compareMode: "stretch", comparePasses: null })).toBe(
      "?view=compare&mode=stretch",
    );
    expect(
      buildAppSearch({ view: "compare", compareMode: null, comparePasses: [3, 1] }),
    ).toBe("?view=compare&passes=3%2C1");
    expect(buildAppSearch({ view: "route", compareMode: "stretch", comparePasses: [1] })).toBe(
      "?view=route&passes=1",
    );
    expect(buildAppSearch({ view: null, compareMode: null, comparePasses: [2, 3] })).toBe(
      "?passes=2%2C3",
    );

    expect(compareModeToSearchParam("segment")).toBeNull();
    expect(compareModeToSearchParam("stretch")).toBe("stretch");

    expect(
      mergeAppSearchParams(
        { view: "compare", compareMode: null, comparePasses: [1, 2] },
        { compareMode: "stretch" },
      ),
    ).toEqual({ view: "compare", compareMode: "stretch", comparePasses: [1, 2] });
  });

  it("resolves and toggles compare pass selection", () => {
    const matched = [1, 2, 3];

    expect(resolveSelectedPassIds(null, matched)).toEqual(matched);
    expect(resolveSelectedPassIds([2, 99], matched)).toEqual([2]);
    expect(resolveSelectedPassIds([99], matched)).toEqual(matched);

    expect(serializeComparePassesParam([1, 2, 3], matched)).toBeNull();
    expect(serializeComparePassesParam([2, 3], matched)).toEqual([2, 3]);

    expect(toggleComparePassSelection([1, 2, 3], 3)).toEqual([1, 2]);
    expect(toggleComparePassSelection([1, 2, 3], 1)).toEqual([2, 3]);
    expect(toggleComparePassSelection([2], 2)).toBeNull();
    expect(toggleComparePassSelection([1, 2], 3)).toEqual([1, 2, 3]);

    expect(excludeComparePass([1, 2, 3], 2)).toEqual([1, 3]);
    expect(excludeComparePass([1, 2, 3], 4)).toEqual([1, 2, 3]);
    expect(excludeComparePass([2], 2)).toBeNull();

    expect(setComparePassIncluded([1, 2, 3], matched, 2, false)).toEqual([1, 3]);
    expect(setComparePassIncluded([1, 3], matched, 2, true)).toEqual([1, 2, 3]);
    expect(setComparePassIncluded([2], matched, 2, false)).toBeNull();
    expect(setComparePassIncluded([1, 2, 3], matched, 2, true)).toEqual([1, 2, 3]);
  });

  it("resolves compare mode from search params", () => {
    const compareParams = { view: "compare" as const, comparePasses: null };

    expect(
      resolveCompareMode(
        { ...compareParams, compareMode: "segment" },
        { segmentTimeAvailable: true, stretchTimeAvailable: true },
      ),
    ).toBe(APP_COMPARE_MODE.SEGMENT);
    expect(
      resolveCompareMode(
        { ...compareParams, compareMode: "stretch" },
        { segmentTimeAvailable: true, stretchTimeAvailable: true },
      ),
    ).toBe(APP_COMPARE_MODE.STRETCH);
    expect(
      resolveCompareMode(
        { ...compareParams, compareMode: "stretch" },
        { segmentTimeAvailable: true, stretchTimeAvailable: false },
      ),
    ).toBe(APP_COMPARE_MODE.SEGMENT);
    expect(
      resolveCompareMode(
        { ...compareParams, compareMode: null },
        { segmentTimeAvailable: true, stretchTimeAvailable: true },
      ),
    ).toBe(APP_COMPARE_MODE.SEGMENT);
    expect(
      resolveCompareMode(
        { view: "route", compareMode: "stretch", comparePasses: null },
        { segmentTimeAvailable: true, stretchTimeAvailable: true },
      ),
    ).toBe(APP_COMPARE_MODE.SEGMENT);
  });

  it("validates modal view against the current route", () => {
    expect(isViewValidForLocation(parseAppLocation(ACTIVITY_PATH), APP_VIEW.ROUTE)).toBe(true);
    expect(isViewValidForLocation(parseAppLocation(SEGMENT_PATH), APP_VIEW.COMPARE)).toBe(true);
    expect(isViewValidForLocation(parseAppLocation(ACTIVITY_PATH), APP_VIEW.COMPARE)).toBe(false);
    expect(isViewValidForLocation(parseAppLocation(SEGMENT_PATH), APP_VIEW.ROUTE)).toBe(false);
    expect(isViewValidForLocation(parseAppLocation(SEGMENTS_PATH), APP_VIEW.ROUTE)).toBe(false);
  });

  it("detects list routes", () => {
    expect(isListLocation(parseAppLocation(SEGMENTS_PATH))).toBe(true);
    expect(isListLocation(parseAppLocation(ACTIVITIES_PATH))).toBe(true);
    expect(isListLocation(parseAppLocation(ACTIVITY_PATH))).toBe(false);
    expect(isListLocation(parseAppLocation(SEGMENT_PATH))).toBe(false);
    expect(isListLocation(parseAppLocation("/segments/2/edit"))).toBe(false);
  });

  it("derives sidebar tab and selection from location", () => {
    expect(deriveSidebarTab(parseAppLocation(SEGMENTS_PATH))).toBe("segments");
    expect(deriveSidebarTab(parseAppLocation(ACTIVITIES_PATH))).toBe("activities");
    expect(deriveSidebarTab(parseAppLocation(ACTIVITY_PATH))).toBe("activities");
    expect(deriveSidebarTab(parseAppLocation("/activities/1/segments/new"))).toBe("activities");
    expect(deriveSidebarTab(parseAppLocation(SEGMENT_PATH))).toBe("segments");
    expect(deriveSidebarTab(parseAppLocation("/segments/2/edit"))).toBe("segments");

    expect(selectedActivityIdFromLocation(parseAppLocation(ACTIVITY_5_PATH))).toBe(5);
    expect(selectedActivityIdFromLocation(parseAppLocation("/activities/5/segments/new"))).toBe(5);
    expect(selectedSegmentIdFromLocation(parseAppLocation("/segments/9"))).toBe(9);
    expect(selectedSegmentIdFromLocation(parseAppLocation("/segments/9/edit"))).toBe(9);
  });

  it("syncs sidebar tab on navigation but keeps user tab on list routes", () => {
    const segmentLocation = parseAppLocation(SEGMENT_PATH);
    const activityLocation = parseAppLocation(ACTIVITY_PATH);

    expect(syncSidebarTabFromLocation(segmentLocation, "activities")).toBe("segments");
    expect(syncSidebarTabFromLocation(activityLocation, "segments")).toBe("activities");
    expect(syncSidebarTabFromLocation(parseAppLocation(ACTIVITIES_PATH), "segments")).toBe("activities");
  });

  it("redirects unknown entities only after lists have loaded", () => {
    const unloadedLists = {
      activitiesLoaded: false,
      segmentsLoaded: false,
      activities: [],
      segments: [],
    };

    expect(
      shouldRedirectUnknownEntity(parseAppLocation(SEGMENT_39_PATH), unloadedLists),
    ).toBe(false);
    expect(
      shouldRedirectUnknownEntity(parseAppLocation(ACTIVITY_5_PATH), unloadedLists),
    ).toBe(false);

    expect(
      shouldRedirectUnknownEntity(parseAppLocation(SEGMENT_39_PATH), {
        ...unloadedLists,
        segmentsLoaded: true,
        segments: [{ id: 1 }],
      }),
    ).toBe(true);
    expect(
      shouldRedirectUnknownEntity(parseAppLocation(SEGMENT_39_PATH), {
        ...unloadedLists,
        segmentsLoaded: true,
        segments: [{ id: 39 }],
      }),
    ).toBe(false);

    expect(
      shouldRedirectUnknownEntity(parseAppLocation(ACTIVITY_5_PATH), {
        ...unloadedLists,
        activitiesLoaded: true,
        activities: [{ id: 5 }],
      }),
    ).toBe(false);
    expect(
      shouldRedirectUnknownEntity(parseAppLocation("/activities/99"), {
        ...unloadedLists,
        activitiesLoaded: true,
        activities: [{ id: 5 }],
      }),
    ).toBe(true);

    expect(
      shouldRedirectUnknownEntity(parseAppLocation(CREATE_SEGMENT_PATH), {
        ...unloadedLists,
        activitiesLoaded: true,
        activities: [{ id: 10 }],
      }),
    ).toBe(false);
    expect(
      shouldRedirectUnknownEntity(parseAppLocation(EDIT_SEGMENT_PATH), {
        ...unloadedLists,
        segmentsLoaded: true,
        segments: [{ id: 3 }],
      }),
    ).toBe(false);
    expect(shouldRedirectUnknownEntity(parseAppLocation(SEGMENTS_PATH), unloadedLists)).toBe(
      false,
    );
  });

  it("clears detail view when switching to the other sidebar tab", () => {
    expect(
      shouldClearDetailOnSidebarTabChange(parseAppLocation(SEGMENT_PATH), "activities"),
    ).toBe(true);
    expect(
      shouldClearDetailOnSidebarTabChange(parseAppLocation(ACTIVITY_PATH), "segments"),
    ).toBe(true);
    expect(
      shouldClearDetailOnSidebarTabChange(parseAppLocation(SEGMENT_PATH), "segments"),
    ).toBe(false);
    expect(
      shouldClearDetailOnSidebarTabChange(parseAppLocation(ACTIVITY_PATH), "activities"),
    ).toBe(false);
    expect(
      shouldClearDetailOnSidebarTabChange(parseAppLocation(SEGMENTS_PATH), "activities"),
    ).toBe(false);
    expect(
      shouldClearDetailOnSidebarTabChange(parseAppLocation(SEGMENT_PATH), "profile"),
    ).toBe(false);
    expect(
      shouldClearDetailOnSidebarTabChange(parseAppLocation(ACTIVITY_PATH), "profile"),
    ).toBe(false);
  });
});