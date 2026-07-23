import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_STRETCH_THRESHOLDS } from "@/services/stretchSegmentation.js";

vi.mock("@/services/stretchPoints.js", () => ({
  loadFirstMatchedActivityId: vi.fn(),
  stretchPointsFromActivityPass: vi.fn(),
  stretchPointsFromReference: vi.fn(),
}));

vi.mock("@/services/stretchRepository.js", () => ({
  loadSegmentStretches: vi.fn(),
  saveSegmentStretches: vi.fn(),
}));

import {
  computeStretchesForSegment,
  persistDefaultStretches,
  resolveStretchSourceActivityId,
  saveStretchesForSegment,
} from "@/services/stretchCompare.js";
import {
  loadFirstMatchedActivityId,
  stretchPointsFromActivityPass,
  stretchPointsFromReference,
} from "@/services/stretchPoints.js";
import { saveSegmentStretches } from "@/services/stretchRepository.js";

const loadFirstMatchedActivityIdMock = vi.mocked(loadFirstMatchedActivityId);
const stretchPointsFromActivityPassMock = vi.mocked(stretchPointsFromActivityPass);
const stretchPointsFromReferenceMock = vi.mocked(stretchPointsFromReference);
const saveSegmentStretchesMock = vi.mocked(saveSegmentStretches);

const flatPoints = Array.from({ length: 20 }, (_, i) => ({
  lat: 48 + i * 0.0002,
  lon: 16.37,
  elevation_m: 100,
}));

describe("stretchCompare orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes stretches from reference or activity pass points", async () => {
    stretchPointsFromReferenceMock.mockResolvedValue(flatPoints);
    const fromRef = await computeStretchesForSegment(1, 2, DEFAULT_STRETCH_THRESHOLDS, false);
    expect(fromRef.stretches.length).toBeGreaterThan(0);
    expect(stretchPointsFromReferenceMock).toHaveBeenCalledWith(1);

    stretchPointsFromActivityPassMock.mockResolvedValue(flatPoints);
    await computeStretchesForSegment(1, 2, DEFAULT_STRETCH_THRESHOLDS, true);
    expect(stretchPointsFromActivityPassMock).toHaveBeenCalledWith(1, 2);
  });

  it("resolves stretch source activity id with fallbacks", async () => {
    await expect(resolveStretchSourceActivityId(1, 10, 77)).resolves.toBe(77);

    loadFirstMatchedActivityIdMock.mockResolvedValueOnce(55);
    await expect(resolveStretchSourceActivityId(1, 10, null)).resolves.toBe(55);

    loadFirstMatchedActivityIdMock.mockResolvedValueOnce(null);
    await expect(resolveStretchSourceActivityId(1, 10, undefined)).resolves.toBe(10);
  });

  it("persists default and requested stretches", async () => {
    stretchPointsFromReferenceMock.mockResolvedValue(flatPoints);
    saveSegmentStretchesMock.mockResolvedValue(undefined);

    const persisted = await persistDefaultStretches(1, 10);
    expect(persisted.stretches.length).toBeGreaterThan(0);
    expect(saveSegmentStretchesMock).toHaveBeenCalledWith(1, 10, expect.any(Object));

    loadFirstMatchedActivityIdMock.mockResolvedValue(22);
    stretchPointsFromActivityPassMock.mockResolvedValue(flatPoints);
    const saved = await saveStretchesForSegment(1, 10, DEFAULT_STRETCH_THRESHOLDS);
    expect(saved.stretchSourceActivityId).toBe(22);
    expect(stretchPointsFromActivityPassMock).toHaveBeenCalled();
  });
});
