import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/middleware/errors.js";

vi.mock("@/db/pool.js", () => ({
  query: vi.fn(),
}));

import { query } from "@/db/pool.js";
import {
  deleteMatchesForSegment,
  deleteMatchesForSegmentActivity,
  deleteReferencePoints,
  deleteSegmentRow,
  getSegmentReferencePoints,
  insertMatches,
  listActivityIdsOverlappingSegment,
  listAllSegments,
  listSegmentsOverlappingActivity,
  loadActivityPoints,
  loadActivitySegmentContext,
  loadReferencePoints,
  loadSegment,
  persistNewSegment,
  saveReferencePoints,
  updateSegmentRow,
} from "@/services/segmentRepository.js";

const queryMock = vi.mocked(query);

const segmentRow = {
  id: 1,
  name: "Hill",
  description: null,
  source_activity_id: 9,
  start_index: 0,
  end_index: 10,
  start_lat: 48,
  start_lon: 16,
  end_lat: 48.01,
  end_lon: 16.01,
  radius_m: 30,
  match_threshold: 0.8,
  location: null,
  tags: ["run"],
};

describe("segmentRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads activity context and points", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ location: "Park", sport: "Run" }],
    } as never);
    await expect(loadActivitySegmentContext(3)).resolves.toEqual({
      location: "Park",
      sport: "Run",
    });

    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] } as never);
    await expect(loadActivitySegmentContext(3)).rejects.toBeInstanceOf(NotFoundError);

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          pt_lat: 48,
          pt_lon: 16,
          pt_elevation_m: 100,
          heart_rate: 120,
          speed_mps: 2,
          timestamp: "2024-01-01T00:00:00Z",
        },
      ],
    } as never);
    await expect(loadActivityPoints(3)).resolves.toEqual([
      {
        lat: 48,
        lon: 16,
        elevation_m: 100,
        heart_rate: 120,
        speed_mps: 2,
        timestamp: "2024-01-01T00:00:00Z",
      },
    ]);
  });

  it("loads and lists segments", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [segmentRow],
    } as never);
    await expect(loadSegment(1)).resolves.toMatchObject({ id: 1, name: "Hill" });

    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] } as never);
    await expect(loadSegment(99)).resolves.toBeNull();

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [segmentRow],
    } as never);
    await expect(listAllSegments()).resolves.toHaveLength(1);

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ activity_id: 4 }, { activity_id: 5 }],
    } as never);
    await expect(listActivityIdsOverlappingSegment(1, 2)).resolves.toEqual([4, 5]);

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [segmentRow],
    } as never);
    await expect(listSegmentsOverlappingActivity(9)).resolves.toHaveLength(1);
  });

  it("persists reference points and matches", async () => {
    queryMock.mockResolvedValue({ rowCount: 1, rows: [] } as never);

    await saveReferencePoints(1, []);
    expect(queryMock).not.toHaveBeenCalled();

    await saveReferencePoints(1, [
      {
        lat: 48,
        lon: 16,
        elevation_m: 10,
        heart_rate: null,
        speed_mps: null,
        timestamp: null,
      },
    ]);
    expect(queryMock).toHaveBeenCalledOnce();

    await deleteReferencePoints(1);
    expect(queryMock).toHaveBeenCalledTimes(2);

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ pt_lat: 48, pt_lon: 16, pt_elevation_m: null }],
    } as never);
    await expect(loadReferencePoints(1)).resolves.toEqual([
      {
        lat: 48,
        lon: 16,
        elevation_m: null,
        heart_rate: null,
        speed_mps: null,
        timestamp: null,
      },
    ]);

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ pt_lat: 48, pt_lon: 16, pt_elevation_m: 5 }],
    } as never);
    await expect(getSegmentReferencePoints(1)).resolves.toEqual([
      { lat: 48, lon: 16, elevation_m: 5 },
    ]);

    await insertMatches(1, 2, []);
    const insertCallsBefore = queryMock.mock.calls.length;
    await insertMatches(1, 2, [
      {
        passNumber: 1,
        matchScore: 0.9,
        startIndex: 0,
        endIndex: 5,
        durationSec: 60,
        distanceM: 100,
        avgSpeedKmh: 6,
        maxSpeedKmh: 8,
        avgHr: 120,
        maxHr: 140,
        elevationGainM: 10,
      },
    ]);
    expect(queryMock.mock.calls.length).toBeGreaterThan(insertCallsBefore);

    await deleteMatchesForSegment(1);
    await deleteMatchesForSegmentActivity(1, 2);
  });

  it("creates, updates, and deletes segment rows", async () => {
    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [segmentRow],
    } as never);
    const created = await persistNewSegment({
      name: "Hill",
      description: null,
      source_activity_id: 9,
      start_index: 0,
      end_index: 10,
      start_lat: 48,
      start_lon: 16,
      end_lat: 48.01,
      end_lon: 16.01,
      radius_m: 30,
      match_threshold: 0.8,
      location: null,
      tags: ["run"],
    });
    expect(created.name).toBe("Hill");

    queryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [{ ...segmentRow, name: "Updated" }],
    } as never);
    const updated = await updateSegmentRow(1, {
      name: "Updated",
      description: null,
      start_index: 0,
      end_index: 10,
      start_lat: 48,
      start_lon: 16,
      end_lat: 48.01,
      end_lon: 16.01,
      radius_m: 30,
      match_threshold: 0.8,
    });
    expect(updated.name).toBe("Updated");

    queryMock.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 1 }] } as never);
    await expect(deleteSegmentRow(1)).resolves.toBe(true);

    queryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] } as never);
    await expect(deleteSegmentRow(1)).resolves.toBe(false);
  });
});
