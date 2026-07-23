import { describe, expect, it } from "vitest";
import { bestValue } from "./bestValue";

describe("bestValue", () => {
  it("returns the maximum by default", () => {
    expect(bestValue([1, 5, 3])).toBe(5);
  });

  it("returns the minimum when lowerIsBetter is true", () => {
    expect(bestValue([1, 5, 3], true)).toBe(1);
  });

  it("ignores null, undefined, and non-finite values", () => {
    expect(bestValue([null, undefined, Number.NaN, 4, 2])).toBe(4);
  });

  it("returns null for an empty or all-invalid list", () => {
    expect(bestValue([])).toBeNull();
    expect(bestValue([null, undefined])).toBeNull();
  });
});