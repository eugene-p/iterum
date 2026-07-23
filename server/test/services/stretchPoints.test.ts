import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestError } from "@/middleware/errors.js";

vi.mock("@/db/pool.js", () => ({
  query: vi.fn(),
}));

vi.mock("@/services/segmentRepository.js", () => ({
  loadActivityPoints: vi.fn(),
  loadReferencePoints: vi.fn(),
}));

import { query } from "@/db/pool.js";
import { loadActivityPoints, loadReferencePoints } from "@/services/segmentRepository.js";
import {
  loadFirstMatchedActivityId,
  stretchPointsFromActivityPass,
  stretchPointsFromReference,
} from "@/services/stretchPoints.js";

const queryMock = vi.mocked(query);
const loadActivityPointsMock = vi.mocked(loadActivityPoints);
const loadReferencePointsMock = vi.mocked(loadReferencePoints);

describe("stretchPoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps reference points into stretch points", async () => {
    loadReferencePointsMock.mockResolvedValue([
      {
        lat: 48,
        lon: 16,
        elevation_m: 100,
        heart_rate: null,
        speed_mps: null,
        timestamp: null,
      },
    ]);

    await expect(stretchPointsFromReference(7)).resolves.toEqual([
      { lat: 48, lon: 16, elevation_m: 100 },
    ]);
    expect(loadReferencePointsMock).toHaveBeenCalledWith(7);
  });

  it("slices activity pass points from match indices", async () => {
    queryMock.mockResolvedValue({
      rowCount: 1,
      rows: [{ start_index: 1, end_index: 2 }],
    } as never);
    loadActivityPointsMock.mockResolvedValue([
      {
        lat: 0,
        lon: 0,
        elevation_m: 1,
        heart_rate: null,
        speed_mps: null,
        timestamp: null,
      },
      {
        lat: 1,
        lon: 1,
        elevation_m: 2,
        heart_rate: null,
        speed_mps: null,
        timestamp: null,
      },
      {
        lat: 2,
        lon: 2,
        elevation_m: 3,
        heart_rate: null,
        speed_mps: null,
        timestamp: null,
      },
    ]);

    await expect(stretchPointsFromActivityPass(3, 9)).resolves.toEqual([
      { lat: 1, lon: 1, elevation_m: 2 },
      { lat: 2, lon: 2, elevation_m: 3 },
    ]);
  });

  it("rejects when the activity has no matched pass", async () => {
    queryMock.mockResolvedValue({ rowCount: 0, rows: [] } as never);
    await expect(stretchPointsFromActivityPass(3, 9)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("returns the first matched activity id or null", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ activity_id: 42 }],
    } as never);
    await expect(loadFirstMatchedActivityId(1)).resolves.toBe(42);

    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] } as never);
    await expect(loadFirstMatchedActivityId(1)).resolves.toBeNull();
  });
});
