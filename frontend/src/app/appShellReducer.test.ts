import { describe, expect, it } from "vitest";
import { APP_SHELL_ACTION_TYPES } from "./appShellActionTypes";
import { appShellReducer, initialAppShellState } from "./appShellReducer";

describe("appShellReducer", () => {
  it("tracks sidebar tab and clears action errors", () => {
    const next = appShellReducer(
      { ...initialAppShellState, actionError: "boom" },
      { type: APP_SHELL_ACTION_TYPES.SET_SIDEBAR_TAB, tab: "activities" },
    );
    expect(next.sidebarTab).toBe("activities");
    expect(next.actionError).toBe("boom");

    const cleared = appShellReducer(next, { type: APP_SHELL_ACTION_TYPES.CLEAR_ACTION_ERROR });
    expect(cleared.actionError).toBeNull();
  });

  it("tracks sidebar expanded state", () => {
    const expanded = appShellReducer(initialAppShellState, {
      type: APP_SHELL_ACTION_TYPES.SET_SIDEBAR_EXPANDED,
      expanded: true,
    });
    expect(expanded.sidebarExpanded).toBe(true);

    const collapsed = appShellReducer(expanded, {
      type: APP_SHELL_ACTION_TYPES.SET_SIDEBAR_EXPANDED,
      expanded: false,
    });
    expect(collapsed.sidebarExpanded).toBe(false);
  });

  it("tracks pending entity selection for sidebar transitions", () => {
    const pending = appShellReducer(initialAppShellState, {
      type: APP_SHELL_ACTION_TYPES.SET_PENDING_SELECTION,
      pending: { kind: "segment", id: 9, fromPathname: "/activities/5" },
    });
    expect(pending.pendingSelection).toEqual({
      kind: "segment",
      id: 9,
      fromPathname: "/activities/5",
    });

    const replaced = appShellReducer(pending, {
      type: APP_SHELL_ACTION_TYPES.SET_PENDING_SELECTION,
      pending: { kind: "activity", id: 5, fromPathname: "/segments/9" },
    });
    expect(replaced.pendingSelection).toEqual({
      kind: "activity",
      id: 5,
      fromPathname: "/segments/9",
    });

    const cleared = appShellReducer(replaced, {
      type: APP_SHELL_ACTION_TYPES.CLEAR_PENDING_SELECTION,
    });
    expect(cleared.pendingSelection).toBeNull();
  });
});
