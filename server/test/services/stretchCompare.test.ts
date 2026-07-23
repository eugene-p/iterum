import { describe, expect, it } from "vitest";
import {
  effectiveSavedStretchSourceActivityId,
  effectiveSavedStretchThresholds,
  isStretchPreviewActive,
  parseStretchPreviewOptions,
  thresholdsEqual,
} from "@/services/stretchCompare.js";
import { DEFAULT_STRETCH_THRESHOLDS } from "@/services/stretchSegmentation.js";
import type { SavedSegmentStretches } from "@/services/stretchRepository.js";

const savedStretch = (
  overrides: Partial<SavedSegmentStretches> = {},
): SavedSegmentStretches => ({
  stretches: [
    {
      index: 1,
      start: { lat: 48, lon: 16.37, elevation_m: 100 },
      end: { lat: 48.001, lon: 16.37, elevation_m: 110 },
      length_m: 100,
      elevation_delta_m: 10,
      avg_grade_pct: 10,
      kind: "climb",
    },
  ],
  stretch_source_activity_id: 10,
  stretch_thresholds: DEFAULT_STRETCH_THRESHOLDS,
  stretch_reason: null,
  ...overrides,
});

describe("thresholdsEqual", () => {
  it("requires a non-null left side and matching keys", () => {
    expect(thresholdsEqual(null, DEFAULT_STRETCH_THRESHOLDS)).toBe(false);
    expect(thresholdsEqual(undefined, DEFAULT_STRETCH_THRESHOLDS)).toBe(false);
    expect(thresholdsEqual(DEFAULT_STRETCH_THRESHOLDS, DEFAULT_STRETCH_THRESHOLDS)).toBe(true);
    expect(
      thresholdsEqual(
        { ...DEFAULT_STRETCH_THRESHOLDS, min_stretch_m: 1 },
        DEFAULT_STRETCH_THRESHOLDS,
      ),
    ).toBe(false);
  });
});

describe("parseStretchPreviewOptions", () => {
  it("returns empty options when query has no overrides", () => {
    expect(parseStretchPreviewOptions({})).toEqual({
      thresholds: undefined,
      stretchSourceActivityId: undefined,
    });
    expect(parseStretchPreviewOptions({ min_stretch_m: "", stretch_source_activity_id: "" })).toEqual(
      {
        thresholds: undefined,
        stretchSourceActivityId: undefined,
      },
    );
  });

  it("parses threshold and source activity overrides", () => {
    const options = parseStretchPreviewOptions({
      min_stretch_m: "50",
      stretch_source_activity_id: "42",
    });
    expect(options.stretchSourceActivityId).toBe(42);
    expect(options.thresholds?.min_stretch_m).toBe(50);
  });

  it("ignores non-finite source activity ids", () => {
    expect(
      parseStretchPreviewOptions({ stretch_source_activity_id: "nope" }).stretchSourceActivityId,
    ).toBeUndefined();
  });
});

describe("effective saved stretch values", () => {
  it("falls back to segment source and default thresholds", () => {
    expect(
      effectiveSavedStretchSourceActivityId(
        savedStretch({ stretch_source_activity_id: null }),
        99,
      ),
    ).toBe(99);
    expect(
      effectiveSavedStretchThresholds(savedStretch({ stretch_thresholds: null })),
    ).toEqual(DEFAULT_STRETCH_THRESHOLDS);
  });
});

describe("isStretchPreviewActive", () => {
  it("is active when nothing is saved", () => {
    expect(isStretchPreviewActive(null, {}, 10)).toBe(true);
  });

  it("treats empty preview as inactive when saved stretches exist", () => {
    expect(isStretchPreviewActive(savedStretch(), {}, 10)).toBe(false);
  });

  it("detects stretch source activity changes", () => {
    expect(isStretchPreviewActive(savedStretch(), { stretchSourceActivityId: 12 }, 10)).toBe(true);
    expect(isStretchPreviewActive(savedStretch(), { stretchSourceActivityId: 10 }, 10)).toBe(false);
  });

  it("treats null saved source as segment source", () => {
    expect(
      isStretchPreviewActive(
        savedStretch({ stretch_source_activity_id: null }),
        { stretchSourceActivityId: 10 },
        10,
      ),
    ).toBe(false);
  });

  it("detects threshold changes against defaults when saved thresholds are null", () => {
    expect(
      isStretchPreviewActive(
        savedStretch({ stretch_thresholds: null }),
        { thresholds: DEFAULT_STRETCH_THRESHOLDS },
        10,
      ),
    ).toBe(false);
    expect(
      isStretchPreviewActive(
        savedStretch({ stretch_thresholds: null }),
        { thresholds: { ...DEFAULT_STRETCH_THRESHOLDS, min_stretch_m: 99 } },
        10,
      ),
    ).toBe(true);
  });

  it("detects threshold changes", () => {
    expect(
      isStretchPreviewActive(
        savedStretch(),
        { thresholds: { ...DEFAULT_STRETCH_THRESHOLDS, min_stretch_m: 99 } },
        10,
      ),
    ).toBe(true);
  });
});
