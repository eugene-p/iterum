import { describe, expect, it } from "vitest";
import {
  planBeginPendingSelection,
  shouldClearPendingSelection,
  shouldShowPendingSelection,
} from "./pendingSelection";
import type { AppLocation } from "./appRoutes";
import type { PendingSelection } from "./appShellTypes";

const PATH_ACTIVITY_5 = "/activities/5";
const PATH_ACTIVITY_3 = "/activities/3";
const PATH_SEGMENT_9 = "/segments/9";
const PATH_SEGMENTS = "/segments";

const activity = (activityId: number): AppLocation => ({ type: "activity", activityId });
const segment = (segmentId: number): AppLocation => ({ type: "segment", segmentId });
const list = (tab: "segments" | "activities" = "segments"): AppLocation => ({
  type: "list",
  tab,
});

const pending = (
  kind: PendingSelection["kind"],
  id: number,
  fromPathname: string,
): PendingSelection => ({ kind, id, fromPathname });

describe("shouldShowPendingSelection", () => {
  it("is false when there is no pending selection", () => {
    expect(shouldShowPendingSelection(null, activity(1))).toBe(false);
  });

  it("is true while the route has not caught up to the pending entity", () => {
    expect(
      shouldShowPendingSelection(pending("segment", 9, PATH_ACTIVITY_5), activity(5)),
    ).toBe(true);
    expect(
      shouldShowPendingSelection(pending("activity", 5, PATH_SEGMENT_9), segment(9)),
    ).toBe(true);
    expect(
      shouldShowPendingSelection(pending("activity", 7, PATH_ACTIVITY_5), activity(5)),
    ).toBe(true);
  });

  it("is false once the route matches the pending entity", () => {
    expect(
      shouldShowPendingSelection(pending("activity", 5, PATH_SEGMENTS), activity(5)),
    ).toBe(false);
    expect(
      shouldShowPendingSelection(pending("segment", 9, PATH_ACTIVITY_5), segment(9)),
    ).toBe(false);
  });

  it("is true on list routes while still waiting for the deferred navigation", () => {
    expect(
      shouldShowPendingSelection(pending("activity", 5, PATH_SEGMENTS), list("segments")),
    ).toBe(true);
  });
});

describe("shouldClearPendingSelection", () => {
  it("is false when nothing is pending", () => {
    expect(shouldClearPendingSelection(null, activity(1), "/activities/1")).toBe(false);
  });

  it("clears when the location matches the pending entity", () => {
    expect(
      shouldClearPendingSelection(
        pending("activity", 5, PATH_SEGMENTS),
        activity(5),
        PATH_ACTIVITY_5,
      ),
    ).toBe(true);
    expect(
      shouldClearPendingSelection(
        pending("segment", 9, PATH_ACTIVITY_5),
        segment(9),
        PATH_SEGMENT_9,
      ),
    ).toBe(true);
  });

  it("does not clear while still on the path where selection started", () => {
    expect(
      shouldClearPendingSelection(
        pending("segment", 9, PATH_ACTIVITY_5),
        activity(5),
        PATH_ACTIVITY_5,
      ),
    ).toBe(false);
    expect(
      shouldClearPendingSelection(
        pending("segment", 9, PATH_SEGMENTS),
        list("segments"),
        PATH_SEGMENTS,
      ),
    ).toBe(false);
  });

  it("clears when navigation settles somewhere other than the start path", () => {
    expect(
      shouldClearPendingSelection(
        pending("segment", 9, PATH_ACTIVITY_5),
        list("segments"),
        PATH_SEGMENTS,
      ),
    ).toBe(true);
    expect(
      shouldClearPendingSelection(
        pending("segment", 9, PATH_ACTIVITY_5),
        activity(3),
        PATH_ACTIVITY_3,
      ),
    ).toBe(true);
  });
});

describe("planBeginPendingSelection", () => {
  it("sets pending when the route is not yet the target", () => {
    expect(
      planBeginPendingSelection(
        { kind: "segment", id: 9 },
        activity(5),
        PATH_ACTIVITY_5,
        null,
      ),
    ).toEqual({
      action: "set",
      pending: pending("segment", 9, PATH_ACTIVITY_5),
    });
  });

  it("clears in-flight pending when re-selecting the already-visible entity", () => {
    expect(
      planBeginPendingSelection(
        { kind: "activity", id: 5 },
        activity(5),
        PATH_ACTIVITY_5,
        pending("segment", 9, PATH_ACTIVITY_5),
      ),
    ).toEqual({ action: "clear" });
  });

  it("is a no-op when already on target with nothing pending", () => {
    expect(
      planBeginPendingSelection(
        { kind: "activity", id: 5 },
        activity(5),
        PATH_ACTIVITY_5,
        null,
      ),
    ).toEqual({ action: "none" });
  });
});
