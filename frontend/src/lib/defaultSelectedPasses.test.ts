import { describe, expect, it } from "vitest";
import type { SegmentPass } from "../types";
import {
  DEFAULT_PASS_SELECTION_POLICY,
  defaultSelectedPassIds,
  type PassSelectionPolicy,
} from "./defaultSelectedPasses";

const JAN = "2024-01-01T00:00:00Z";
const FEB = "2024-02-01T00:00:00Z";
const MAR = "2024-03-01T00:00:00Z";
const APR = "2024-04-01T00:00:00Z";
const MAY = "2024-05-01T00:00:00Z";
const JUN = "2024-06-01T00:00:00Z";
const JUL = "2024-07-01T00:00:00Z";

const pass = (
  partial: Pick<SegmentPass, "id"> &
    Partial<Pick<SegmentPass, "duration_sec" | "started_at" | "created_at" | "matched">>,
): SegmentPass => ({
  id: partial.id,
  activity_id: partial.id * 10,
  activity_name: `A${partial.id}`,
  pass_number: 1,
  match_score: 1,
  matched: partial.matched ?? true,
  duration_sec: partial.duration_sec ?? null,
  started_at: partial.started_at ?? null,
  created_at: partial.created_at ?? null,
});

describe("defaultSelectedPassIds", () => {
  it("returns empty for no matched passes", () => {
    expect(defaultSelectedPassIds([])).toEqual([]);
    expect(defaultSelectedPassIds([pass({ id: 1, matched: false })])).toEqual([]);
  });

  it("returns all matched when count is at most 5", () => {
    const five = [
      pass({ id: 1, duration_sec: 600, started_at: JAN }),
      pass({ id: 2, duration_sec: 500, started_at: FEB }),
      pass({ id: 3, duration_sec: 100, started_at: MAR }),
      pass({ id: 4, duration_sec: 200, started_at: APR }),
      pass({ id: 5, duration_sec: 300, started_at: MAY }),
    ];
    expect(defaultSelectedPassIds(five)).toEqual([1, 2, 3, 4, 5]);
  });

  it("uses 3 fastest and 2 latest when more than 5 matches", () => {
    const passes = [
      pass({ id: 1, duration_sec: 600, started_at: JAN }),
      pass({ id: 2, duration_sec: 500, started_at: FEB }),
      pass({ id: 3, duration_sec: 100, started_at: MAR }),
      pass({ id: 4, duration_sec: 200, started_at: APR }),
      pass({ id: 5, duration_sec: 300, started_at: MAY }),
      pass({ id: 6, duration_sec: 400, started_at: JUN }),
      pass({ id: 7, duration_sec: 450, started_at: JUL }),
    ];
    // fastest 3: 3,4,5; latest 2 exclusive: 7,6
    expect(defaultSelectedPassIds(passes)).toEqual([3, 4, 5, 6, 7]);
  });

  it("fills latest from outside the fastest set so overlap still yields 5", () => {
    const passes = [
      pass({ id: 1, duration_sec: 600, started_at: JAN }),
      pass({ id: 2, duration_sec: 500, started_at: FEB }),
      pass({ id: 3, duration_sec: 100, started_at: MAR }), // 2nd fastest
      pass({ id: 4, duration_sec: 200, started_at: APR }), // 3rd fastest
      pass({ id: 5, duration_sec: 350, started_at: MAY }), // next after exclusive latest skip
      pass({ id: 6, duration_sec: 400, started_at: JUN }), // exclusive latest
      pass({ id: 7, duration_sec: 50, started_at: JUL }), // fastest + most recent → only counts once
    ];
    // fastest 3: 7,3,4; latest 2 excluding those: 6,5 → five ids
    expect(defaultSelectedPassIds(passes)).toEqual([3, 4, 5, 6, 7]);
  });

  it("excludes null duration from fastest pool but keeps via latest", () => {
    const passes = [
      pass({ id: 1, duration_sec: null, started_at: JUN }),
      pass({ id: 2, duration_sec: 100, started_at: JAN }),
      pass({ id: 3, duration_sec: 200, started_at: FEB }),
      pass({ id: 4, duration_sec: 300, started_at: MAR }),
      pass({ id: 5, duration_sec: null, started_at: MAY }),
    ];
    expect(defaultSelectedPassIds(passes)).toEqual([1, 2, 3, 4, 5]);
  });

  it("falls back to created_at when started_at is missing", () => {
    const passes = [
      pass({ id: 1, duration_sec: 100, created_at: JAN }),
      pass({ id: 2, duration_sec: 200, created_at: JUN }),
      pass({ id: 3, duration_sec: 300, created_at: MAY }),
    ];
    expect(defaultSelectedPassIds(passes)).toEqual([1, 2, 3]);
  });

  it("falls back to created_at when started_at is unparseable", () => {
    const passes = [
      pass({ id: 1, duration_sec: 500, started_at: "not-a-date", created_at: JAN }),
      pass({ id: 2, duration_sec: 400, started_at: "also-bad", created_at: JUN }),
      pass({ id: 3, duration_sec: 300, started_at: FEB }),
    ];
    // latest 2 excluding fastest: fastest 3,1,2 → all three; latest still ranks by created_at for 1/2
    expect(defaultSelectedPassIds(passes)).toEqual([1, 2, 3]);
  });

  it("ranks missing timestamps last for latest", () => {
    const passes = [
      pass({ id: 1, duration_sec: 500, started_at: null }),
      pass({ id: 2, duration_sec: 400, started_at: JAN }),
      pass({ id: 3, duration_sec: 300, started_at: FEB }),
    ];
    expect(defaultSelectedPassIds(passes)).toEqual([1, 2, 3]);
  });

  it("selects fewer when N is small", () => {
    const passes = [
      pass({ id: 1, duration_sec: 100, started_at: JAN }),
      pass({ id: 2, duration_sec: 200, started_at: FEB }),
    ];
    expect(defaultSelectedPassIds(passes)).toEqual([1, 2]);
  });

  it("respects custom fastestCount and latestCount", () => {
    const policy: PassSelectionPolicy = {
      id: "recentAndFastest",
      fastestCount: 1,
      latestCount: 1,
    };
    const passes = [
      pass({ id: 1, duration_sec: 100, started_at: JAN }),
      pass({ id: 2, duration_sec: 50, started_at: FEB }),
      pass({ id: 3, duration_sec: 200, started_at: JUN }),
    ];
    expect(defaultSelectedPassIds(passes, policy)).toEqual([2, 3]);
  });

  it("returns all matched for all policy", () => {
    const passes = [
      pass({ id: 1, duration_sec: 100, started_at: JAN }),
      pass({ id: 2, duration_sec: 200, started_at: FEB }),
      pass({ id: 3, matched: false }),
    ];
    expect(defaultSelectedPassIds(passes, { id: "all" })).toEqual([1, 2]);
  });

  it("exports default policy constants", () => {
    expect(DEFAULT_PASS_SELECTION_POLICY).toEqual({
      id: "recentAndFastest",
      fastestCount: 3,
      latestCount: 2,
    });
  });

  it("returns all when N is small even with no duration or timestamps", () => {
    const passes = [pass({ id: 1 }), pass({ id: 2 }), pass({ id: 3 })];
    expect(defaultSelectedPassIds(passes)).toEqual([1, 2, 3]);
  });
});
