import { describe, expect, it } from "vitest";
import { formatTags } from "./formatTags";

describe("formatTags", () => {
  it("joins tags with middle dots", () => {
    expect(formatTags(["morning", "run", "hills"])).toBe("morning · run · hills");
  });

  it("returns null for empty tags", () => {
    expect(formatTags([])).toBeNull();
    expect(formatTags(undefined)).toBeNull();
  });
});