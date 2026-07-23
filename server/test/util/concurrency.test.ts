import { describe, expect, it } from "vitest";
import { mapPool } from "@/util/concurrency.js";

describe("mapPool", () => {
  it("returns empty results for empty input", async () => {
    expect(await mapPool([], 4, async (item) => item)).toEqual([]);
  });

  it("preserves order under limited concurrency", async () => {
    const started: number[] = [];
    const results = await mapPool([1, 2, 3, 4, 5], 2, async (item, index) => {
      started.push(index);
      await new Promise((resolve) => setTimeout(resolve, 5 * (6 - item)));
      return item * 10;
    });

    expect(results).toEqual([10, 20, 30, 40, 50]);
    expect(started).toHaveLength(5);
  });

  it("clamps concurrency to at least one worker", async () => {
    const results = await mapPool(["a", "b"], 0, async (item) => item.toUpperCase());
    expect(results).toEqual(["A", "B"]);
  });
});
