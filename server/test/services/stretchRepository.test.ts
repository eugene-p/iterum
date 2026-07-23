import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_STRETCH_THRESHOLDS } from "@/services/stretchSegmentation.js";

vi.mock("@/db/pool.js", () => ({
  query: vi.fn(),
  withTransaction: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}));

import { query, withTransaction } from "@/db/pool.js";
import {
  deleteSegmentStretches,
  loadSegmentStretches,
  saveSegmentStretches,
} from "@/services/stretchRepository.js";

const queryMock = vi.mocked(query);
const withTransactionMock = vi.mocked(withTransaction);

describe("stretchRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when segment meta, stretch rows, or thresholds are missing", async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] } as never);
    await expect(loadSegmentStretches(1)).resolves.toBeNull();

    queryMock
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            stretch_source_activity_id: 2,
            stretch_thresholds: DEFAULT_STRETCH_THRESHOLDS,
            stretch_reason: null,
          },
        ],
      } as never)
      .mockResolvedValueOnce({ rowCount: 0, rows: [] } as never);
    await expect(loadSegmentStretches(1)).resolves.toBeNull();

    queryMock
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            stretch_source_activity_id: 2,
            stretch_thresholds: null,
            stretch_reason: null,
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            stretch_index: 1,
            start_lat: 48,
            start_lon: 16,
            start_elevation_m: 100,
            end_lat: 48.001,
            end_lon: 16,
            end_elevation_m: 110,
            length_m: 100,
          },
        ],
      } as never);
    await expect(loadSegmentStretches(1)).resolves.toBeNull();
  });

  it("loads and enriches saved stretches", async () => {
    queryMock
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            stretch_source_activity_id: 5,
            stretch_thresholds: DEFAULT_STRETCH_THRESHOLDS,
            stretch_reason: "ok",
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            stretch_index: 1,
            start_lat: 48,
            start_lon: 16,
            start_elevation_m: 100,
            end_lat: 48.001,
            end_lon: 16,
            end_elevation_m: 120,
            length_m: 200,
          },
        ],
      } as never);

    const loaded = await loadSegmentStretches(9);
    expect(loaded).not.toBeNull();
    expect(loaded!.stretch_source_activity_id).toBe(5);
    expect(loaded!.stretch_reason).toBe("ok");
    expect(loaded!.stretches).toHaveLength(1);
    expect(loaded!.stretches[0].kind).toBe("climb");
    expect(loaded!.stretches[0].elevation_delta_m).toBe(20);
  });

  it("saves stretches inside a transaction", async () => {
    queryMock.mockResolvedValue({ rowCount: 1, rows: [] } as never);

    await saveSegmentStretches(3, 8, {
      stretches: [
        {
          index: 1,
          start: { lat: 1, lon: 2, elevation_m: 10 },
          end: { lat: 1.1, lon: 2.1, elevation_m: 20 },
          length_m: 50,
          elevation_delta_m: 10,
          avg_grade_pct: 20,
          kind: "climb",
        },
      ],
      segment_length_m: 50,
      thresholds: DEFAULT_STRETCH_THRESHOLDS,
      reason: "test",
    });

    expect(withTransactionMock).toHaveBeenCalledOnce();
    expect(queryMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("deletes stretches and clears segment metadata", async () => {
    queryMock.mockResolvedValue({ rowCount: 1, rows: [] } as never);
    await deleteSegmentStretches(4);
    expect(withTransactionMock).toHaveBeenCalledOnce();
    expect(queryMock).toHaveBeenCalledTimes(2);
  });
});
