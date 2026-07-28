import { describe, expect, it } from "vitest";
import { createEditorScreen } from "../app/editorTypes";
import { applyCloseLoop, applyEditorMapClick } from "./segmentEditorUtils";
import type { TrackPoint } from "../types";

/**
 * Out-and-back with GPS drift on the return mid-point so a provisional nearest
 * start snap would land on the return visit (index 4).
 */
const outAndBack: TrackPoint[] = [
  { lat: 48.0, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
  { lat: 48.001, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
  { lat: 48.002, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
  { lat: 48.003, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
  { lat: 48.00205, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
  { lat: 48.001, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
  { lat: 48.0, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
];

describe("applyEditorMapClick", () => {
  it("stores a provisional start marker without locking a track index", () => {
    const mode = { kind: "create" as const, activityId: 1 };
    let screen = createEditorScreen(mode, "pick");
    screen = { ...screen, pickMode: "start" };
    // Click nearer the return mid-point — must not bind start_index to 4 yet.
    screen = applyEditorMapClick(screen, outAndBack, 48.00205, 16.0);
    expect(screen.pickMode).toBe("end");
    expect(screen.draft.start_lat).toBe(48.00205);
    expect(screen.draft.start_lon).toBe(16.0);
    expect(screen.draft.start_index).toBeUndefined();
    expect(screen.draft.end_lat).toBeUndefined();
    expect(screen.draft.end_index).toBeUndefined();
  });

  it("re-resolves start and end together when the end is clicked", () => {
    const mode = { kind: "create" as const, activityId: 1 };
    let screen = createEditorScreen(mode, "pick");

    screen = { ...screen, pickMode: "start" };
    screen = applyEditorMapClick(screen, outAndBack, 48.00205, 16.0);
    expect(screen.draft.start_index).toBeUndefined();

    screen = applyEditorMapClick(screen, outAndBack, 48.003, 16.0);

    expect(screen.error).toBeNull();
    expect(screen.draft.start_index).toBe(2);
    expect(screen.draft.end_index).toBe(3);
    expect(screen.pickMode).toBe("none");
  });
});

describe("applyCloseLoop", () => {
  it("sets end same as start from the earliest visit, not a late snap", () => {
    const twoLaps: TrackPoint[] = [
      { lat: 48.0, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.0, lon: 16.001, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.001, lon: 16.001, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.001, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.0, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.0, lon: 16.001, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.001, lon: 16.001, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.001, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
      { lat: 48.0, lon: 16.0, ele: null, time: null, hr: null, cadence: null, speed: null },
    ];

    const mode = { kind: "create" as const, activityId: 1 };
    let screen = createEditorScreen(mode, "pick");
    screen = { ...screen, pickMode: "start" };
    // Provisional click near start/finish (no index).
    screen = applyEditorMapClick(screen, twoLaps, 48.0, 16.0);
    expect(screen.draft.start_index).toBeUndefined();

    screen = applyCloseLoop(screen, twoLaps);

    expect(screen.error).toBeNull();
    expect(screen.pickMode).toBe("none");
    expect(screen.draft.start_index).toBe(0);
    expect(screen.draft.end_index).toBe(4);
  });

  it("does not reverse direction when the click is nearer a late visit of the start line", () => {
    const mode = { kind: "create" as const, activityId: 1 };
    let screen = createEditorScreen(mode, "pick");
    screen = { ...screen, pickMode: "start" };
    // Click slightly closer to the final return (index 6) than the start.
    screen = applyEditorMapClick(screen, outAndBack, 48.0, 16.0 + 1e-9);
    screen = applyCloseLoop(screen, outAndBack);

    expect(screen.error).toBeNull();
    expect(screen.draft.start_index).toBe(0);
    expect(screen.draft.end_index).toBe(6);
    expect(screen.draft.end_index!).toBeGreaterThan(screen.draft.start_index!);
  });
});
