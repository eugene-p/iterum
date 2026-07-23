import { describe, expect, it } from "vitest";
import { formatSidebarListCount } from "./sidebarListUtils";

describe("formatSidebarListCount", () => {
  it("uses singular noun for a single total item", () => {
    expect(formatSidebarListCount(1, 1, "segment")).toBe("1 segment");
    expect(formatSidebarListCount(1, 1, "activity")).toBe("1 activity");
  });

  it("shows total count when all items are visible", () => {
    expect(formatSidebarListCount(5, 5, "segment")).toBe("5 segments");
  });

  it("shows filtered count when search narrows the list", () => {
    expect(formatSidebarListCount(3, 10, "activity")).toBe("3 of 10 activities");
  });
});