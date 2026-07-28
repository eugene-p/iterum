import { describe, expect, it } from "vitest";
import type { SegmentPass } from "../types";
import {
  PASS_SELECT_RANK_MAX,
  PASS_SELECT_SPACED_MAX,
  PASS_SIMPLE_PATH_MAX,
  PASS_SPACED_1MO_MS,
  PASS_SPACED_2W_MS,
  applyPassSelectMode,
  filterPassesByQuery,
  isSimplePassSelectionPath,
  selectTimeSpacedPassIds,
  sortPasses,
} from "./passSelectModes";

const D_JAN = "2024-01-01T00:00:00Z";
const D_JAN_08 = "2024-01-08T00:00:00Z";
const D_JAN_15 = "2024-01-15T00:00:00Z";
const D_FEB = "2024-02-01T00:00:00Z";
const D_MAR = "2024-03-01T00:00:00Z";
const D_APR = "2024-04-01T00:00:00Z";
const D_MAY = "2024-05-01T00:00:00Z";
const D_JUN = "2024-06-01T00:00:00Z";
const D_JUL = "2024-07-01T00:00:00Z";

const pass = (
  partial: Pick<SegmentPass, "id"> &
    Partial<
      Pick<
        SegmentPass,
        | "duration_sec"
        | "started_at"
        | "created_at"
        | "matched"
        | "activity_name"
        | "source_filename"
      >
    >,
): SegmentPass => ({
  id: partial.id,
  activity_id: partial.id * 10,
  activity_name: partial.activity_name ?? `A${partial.id}`,
  source_filename: partial.source_filename ?? null,
  pass_number: 1,
  match_score: 1,
  matched: partial.matched ?? true,
  duration_sec: partial.duration_sec ?? null,
  started_at: partial.started_at ?? null,
  created_at: partial.created_at ?? null,
});

describe("isSimplePassSelectionPath", () => {
  it("is true for 0..5 matched and false above", () => {
    expect(isSimplePassSelectionPath(0)).toBe(true);
    expect(isSimplePassSelectionPath(PASS_SIMPLE_PATH_MAX)).toBe(true);
    expect(isSimplePassSelectionPath(PASS_SIMPLE_PATH_MAX + 1)).toBe(false);
  });
});

describe("filterPassesByQuery", () => {
  const passes = [
    pass({ id: 1, activity_name: "Morning loop", source_filename: "a.fit" }),
    pass({ id: 2, activity_name: "Hill session", source_filename: "hill.gpx" }),
    pass({ id: 3, activity_name: "Evening", source_filename: "morning-copy.fit" }),
  ];

  it("returns all when query is empty or whitespace", () => {
    expect(filterPassesByQuery(passes, "")).toEqual(passes);
    expect(filterPassesByQuery(passes, "  ")).toEqual(passes);
  });

  it("matches activity name case-insensitively", () => {
    expect(filterPassesByQuery(passes, "hill").map((p) => p.id)).toEqual([2]);
  });

  it("matches source filename", () => {
    expect(filterPassesByQuery(passes, "morning-copy").map((p) => p.id)).toEqual([3]);
  });
});

describe("sortPasses", () => {
  const passes = [
    pass({ id: 1, activity_name: "B", duration_sec: 300, started_at: D_JAN }),
    pass({ id: 2, activity_name: "A", duration_sec: 100, started_at: D_MAR }),
    pass({ id: 3, activity_name: "C", duration_sec: 200, started_at: D_FEB }),
  ];

  it("sorts by latest date first", () => {
    expect(sortPasses(passes, "latest").map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it("sorts by fastest (lowest duration) first", () => {
    expect(sortPasses(passes, "fastest").map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it("sorts by name ascending", () => {
    expect(sortPasses(passes, "name").map((p) => p.id)).toEqual([2, 1, 3]);
  });

  it("does not mutate the input", () => {
    const original = [...passes];
    sortPasses(passes, "name");
    expect(passes.map((p) => p.id)).toEqual(original.map((p) => p.id));
  });
});

describe("selectTimeSpacedPassIds", () => {
  it("returns empty when no dated matched passes", () => {
    expect(
      selectTimeSpacedPassIds([pass({ id: 1, started_at: null, created_at: null })], PASS_SPACED_2W_MS, {
        maxCount: 8,
      }),
    ).toEqual([]);
  });

  it("picks newest then skips until interval elapsed", () => {
    const passes = [
      pass({ id: 1, started_at: D_JAN }),
      pass({ id: 2, started_at: D_JAN_08 }),
      pass({ id: 3, started_at: D_JAN_15 }),
      pass({ id: 4, started_at: D_FEB }),
    ];
    // newest-first: 4 → 3 (≥14d) → skip 2 (7d) → 1 (≥14d from 3)
    expect(selectTimeSpacedPassIds(passes, PASS_SPACED_2W_MS, { maxCount: 8 })).toEqual([4, 3, 1]);
  });

  it("respects maxCount after greedy spacing", () => {
    const passes = [
      pass({ id: 1, started_at: D_JAN }),
      pass({ id: 2, started_at: D_FEB }),
      pass({ id: 3, started_at: D_MAR }),
      pass({ id: 4, started_at: D_APR }),
    ];
    expect(selectTimeSpacedPassIds(passes, PASS_SPACED_2W_MS, { maxCount: 2 })).toEqual([4, 3]);
  });

  it("uses created_at when started_at missing", () => {
    const passes = [
      pass({ id: 1, created_at: D_JAN }),
      pass({ id: 2, created_at: D_MAR }),
    ];
    expect(selectTimeSpacedPassIds(passes, PASS_SPACED_1MO_MS, { maxCount: 8 })).toEqual([2, 1]);
  });

  it("ignores undated passes", () => {
    const passes = [
      pass({ id: 1, started_at: null }),
      pass({ id: 2, started_at: D_JUN }),
    ];
    expect(selectTimeSpacedPassIds(passes, PASS_SPACED_2W_MS, { maxCount: 8 })).toEqual([2]);
  });

  it("returns empty when every matched pass is undated", () => {
    const passes = [
      pass({ id: 1, started_at: null, created_at: null }),
      pass({ id: 2, started_at: null, created_at: null }),
    ];
    expect(selectTimeSpacedPassIds(passes, PASS_SPACED_2W_MS, { maxCount: 8 })).toEqual([]);
  });
});

describe("applyPassSelectMode", () => {
  const many = [
    pass({ id: 1, duration_sec: 600, started_at: D_JAN }),
    pass({ id: 2, duration_sec: 500, started_at: D_FEB }),
    pass({ id: 3, duration_sec: 100, started_at: D_MAR }),
    pass({ id: 4, duration_sec: 200, started_at: D_APR }),
    pass({ id: 5, duration_sec: 300, started_at: D_MAY }),
    pass({ id: 6, duration_sec: 400, started_at: D_JUN }),
    pass({ id: 7, duration_sec: 450, started_at: D_JUL }),
  ];

  it("default uses policy (3 fastest + 2 latest)", () => {
    expect(applyPassSelectMode(many, "default")).toEqual([3, 4, 5, 6, 7]);
  });

  it("fastest takes top maxCount by duration", () => {
    // durations: 3=100, 4=200, 5=300, 6=400, 7=450, 2=500, 1=600
    expect(applyPassSelectMode(many, "fastest", { maxCount: PASS_SELECT_RANK_MAX })).toEqual([
      3, 4, 5, 6, 7,
    ]);
  });

  it("latest takes top maxCount by date", () => {
    expect(applyPassSelectMode(many, "latest", { maxCount: PASS_SELECT_RANK_MAX })).toEqual([
      7, 6, 5, 4, 3,
    ]);
  });

  it("all returns every matched id in input order", () => {
    expect(applyPassSelectMode(many, "all")).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(
      applyPassSelectMode([...many, pass({ id: 9, matched: false })], "all"),
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("spaced2w and spaced1mo use interval and default spaced max", () => {
    const spaced = applyPassSelectMode(many, "spaced2w", { maxCount: PASS_SELECT_SPACED_MAX });
    expect(spaced[0]).toBe(7);
    expect(spaced.length).toBeLessThanOrEqual(PASS_SELECT_SPACED_MAX);

    const monthly = applyPassSelectMode(many, "spaced1mo", { maxCount: PASS_SELECT_SPACED_MAX });
    expect(monthly[0]).toBe(7);
    expect(monthly.length).toBeLessThanOrEqual(PASS_SELECT_SPACED_MAX);
  });

  it("returns empty for no matched", () => {
    expect(applyPassSelectMode([pass({ id: 1, matched: false })], "all")).toEqual([]);
  });

  it("fastest returns empty when no finite durations", () => {
    const passes = [
      pass({ id: 1, duration_sec: null, started_at: D_JAN }),
      pass({ id: 2, duration_sec: null, started_at: D_FEB }),
    ];
    expect(applyPassSelectMode(passes, "fastest")).toEqual([]);
  });

  it("spaced1mo picks newest-first with month spacing up to maxCount", () => {
    const passes = [
      pass({ id: 1, started_at: D_JAN }),
      pass({ id: 2, started_at: D_JAN_15 }),
      pass({ id: 3, started_at: D_MAR }),
      pass({ id: 4, started_at: D_MAY }),
    ];
    // 4 (May1) → 3 (Mar1, 61d) → 2 (Jan15, 45d); 1 is only 14d before 2
    expect(applyPassSelectMode(passes, "spaced1mo", { maxCount: 8 })).toEqual([4, 3, 2]);
  });
});
