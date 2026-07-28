import { describe, expect, it } from "vitest";
import {
  stretchSourceLabel,
  stretchSourceOptionsFromPasses,
} from "./stretchSourceOptions";

const pass = (
  id: number,
  activityId: number,
  name: string,
  passNumber = 1,
) => ({
  id,
  activity_id: activityId,
  activity_name: name,
  pass_number: passNumber,
});

describe("stretchSourceOptionsFromPasses", () => {
  it("returns one option per activity, first pass wins", () => {
    expect(
      stretchSourceOptionsFromPasses([
        pass(1, 10, "Morning", 1),
        pass(2, 10, "Morning", 2),
        pass(3, 20, "Evening", 1),
      ]),
    ).toEqual([
      { activityId: 10, passId: 1, label: "Morning" },
      { activityId: 20, passId: 3, label: "Evening" },
    ]);
  });

  it("annotates pass number when greater than 1 on first seen pass", () => {
    expect(stretchSourceOptionsFromPasses([pass(1, 10, "Loop", 2)])).toEqual([
      { activityId: 10, passId: 1, label: "Loop · pass 2" },
    ]);
  });
});

describe("stretchSourceLabel", () => {
  const options = stretchSourceOptionsFromPasses([
    pass(1, 10, "Morning"),
    pass(3, 20, "Evening"),
  ]);

  it("prefers pass id match", () => {
    expect(stretchSourceLabel(options, 3, 10)).toBe("Evening");
  });

  it("falls back to activity id", () => {
    expect(stretchSourceLabel(options, null, 10)).toBe("Morning");
  });

  it("falls back to segment default when unknown", () => {
    expect(stretchSourceLabel(options, null, null)).toBe("Segment default");
  });
});
