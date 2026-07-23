import { describe, expect, it } from "vitest";
import {
  identityColorsDistinctFromPositionColors,
  PASS_IDENTITY_COLORS,
  REFERENCE_IDENTITY_COLOR,
} from "./passIdentityColors";
import { STRETCH_PROGRESS_COLORS } from "../../stretchUtils";

describe("passIdentityColors", () => {
  it("does not reuse stretch position ranking colors", () => {
    expect(identityColorsDistinctFromPositionColors()).toBe(true);
    const positionSet = new Set<string>(STRETCH_PROGRESS_COLORS);
    expect(positionSet.has(REFERENCE_IDENTITY_COLOR)).toBe(false);
    for (const color of PASS_IDENTITY_COLORS) {
      expect(positionSet.has(color)).toBe(false);
    }
  });
});