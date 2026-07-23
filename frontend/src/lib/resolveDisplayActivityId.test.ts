import { describe, expect, it } from "vitest";
import { resolveDisplayActivityId } from "./resolveDisplayActivityId";

describe("resolveDisplayActivityId", () => {
  it("prefers segment editor activity id", () => {
    expect(
      resolveDisplayActivityId({
        segmentEditorActivityId: 10,
        selectedPassActivityId: 20,
        sourceActivityId: 30,
        selectedActivityId: 40,
      }),
    ).toBe(10);
  });

  it("falls back through pass, source, and selected ids", () => {
    expect(
      resolveDisplayActivityId({
        selectedPassActivityId: 20,
        sourceActivityId: 30,
        selectedActivityId: 40,
      }),
    ).toBe(20);

    expect(
      resolveDisplayActivityId({
        sourceActivityId: 30,
        selectedActivityId: 40,
      }),
    ).toBe(30);

    expect(resolveDisplayActivityId({ selectedActivityId: 40 })).toBe(40);
  });

  it("returns null when no id is available", () => {
    expect(resolveDisplayActivityId({ selectedActivityId: null })).toBeNull();
  });
});