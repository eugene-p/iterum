import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearLastOpened,
  readLastOpened,
  resolveResumeTargets,
  writeLastOpenedActivity,
  writeLastOpenedSegment,
} from "./lastOpenedStorage";

const createMemoryStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
};

describe("lastOpenedStorage", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
    });
  });

  afterEach(() => {
    clearLastOpened();
  });

  it("starts empty", () => {
    expect(readLastOpened()).toEqual({ segmentId: null, activityId: null });
  });

  it("stores segment and activity independently", () => {
    writeLastOpenedSegment(3);
    expect(readLastOpened()).toEqual({ segmentId: 3, activityId: null });
    writeLastOpenedActivity(9);
    expect(readLastOpened()).toEqual({ segmentId: 3, activityId: 9 });
    writeLastOpenedSegment(4);
    expect(readLastOpened()).toEqual({ segmentId: 4, activityId: 9 });
  });

  it("resolves resume targets only when still present", () => {
    const last = { segmentId: 1, activityId: 2 };
    const segments = [
      { id: 1, name: "Climb" },
      { id: 9, name: "Other" },
    ];
    const activities = [{ id: 5, name: "Ride" }];

    expect(resolveResumeTargets(last, segments, activities)).toEqual({
      segment: { id: 1, name: "Climb" },
      activity: null,
    });

    expect(
      resolveResumeTargets(
        { segmentId: 1, activityId: 5 },
        segments,
        activities,
      ),
    ).toEqual({
      segment: { id: 1, name: "Climb" },
      activity: { id: 5, name: "Ride" },
    });
  });
});
