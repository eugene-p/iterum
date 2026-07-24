import { describe, expect, it } from "vitest";
import { formatRelativePast } from "./formatRelativePast";

const now = new Date("2026-07-23T12:00:00Z");

describe("formatRelativePast", () => {
  it("returns null for invalid dates", () => {
    expect(formatRelativePast("not-a-date", now)).toBeNull();
  });

  it("formats short intervals", () => {
    expect(formatRelativePast("2026-07-23T11:59:30Z", now)).toBe("just now");
    expect(formatRelativePast("2026-07-23T11:40:00Z", now)).toBe("20m ago");
    expect(formatRelativePast("2026-07-23T09:00:00Z", now)).toBe("3h ago");
  });

  it("formats days and longer", () => {
    expect(formatRelativePast("2026-07-19T12:00:00Z", now)).toBe("4d ago");
    expect(formatRelativePast("2026-06-23T12:00:00Z", now)).toBe("1mo ago");
    expect(formatRelativePast("2024-07-23T12:00:00Z", now)).toBe("2y ago");
  });
});
