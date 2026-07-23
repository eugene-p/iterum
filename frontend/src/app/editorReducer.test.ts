import { describe, expect, it } from "vitest";
import { EDITOR_ACTION_TYPES } from "./editorActionTypes";
import { createEditorScreen } from "./editorTypes";
import { editorReducer } from "./editorReducer";

describe("editorReducer", () => {
  const base = createEditorScreen(
    { kind: "create", activityId: 1 },
    "Set start and end on this activity's route, then save.",
  );

  it("updates editor form fields", () => {
    const named = editorReducer(base, {
      type: EDITOR_ACTION_TYPES.SET_NAME,
      name: "Hill repeat",
    });
    expect(named.name).toBe("Hill repeat");

    const withPick = editorReducer(named, {
      type: EDITOR_ACTION_TYPES.SET_PICK_MODE,
      pickMode: "start",
      notice: "Click the route for the segment start.",
    });
    expect(withPick.pickMode).toBe("start");
    expect(withPick.notice).toBe("Click the route for the segment start.");
  });

  it("clears draft and resets pick mode", () => {
    const withDraft = editorReducer(
      { ...base, draft: { start_lat: 1, start_lon: 2 }, pickMode: "end", error: "oops" },
      { type: EDITOR_ACTION_TYPES.CLEAR_DRAFT },
    );
    expect(withDraft.draft).toEqual({});
    expect(withDraft.pickMode).toBe("none");
    expect(withDraft.error).toBeNull();
  });
});