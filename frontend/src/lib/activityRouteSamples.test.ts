import { describe, expect, it, vi } from "vitest";
import { fetchActivityRouteSamplesMap } from "./activityRouteSamples";

describe("fetchActivityRouteSamplesMap", () => {
  it("fetches each id once and maps points", async () => {
    const fetchSample = vi.fn(async (id: number) => ({
      points: [{ lat: id, lon: id }],
    }));

    const map = await fetchActivityRouteSamplesMap([1, 2, 1], fetchSample);
    expect(fetchSample).toHaveBeenCalledTimes(2);
    expect(map.get(1)).toEqual([{ lat: 1, lon: 1 }]);
    expect(map.get(2)).toEqual([{ lat: 2, lon: 2 }]);
  });

  it("records empty points when a fetch fails", async () => {
    const fetchSample = vi.fn(async (id: number) => {
      if (id === 2) throw new Error("boom");
      return { points: [{ lat: 1, lon: 1 }] };
    });

    const map = await fetchActivityRouteSamplesMap([1, 2], fetchSample);
    expect(map.get(1)).toHaveLength(1);
    expect(map.get(2)).toEqual([]);
  });
});
