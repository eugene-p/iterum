import { describe, expect, it } from "vitest";
import {
  chunkIndices,
  insertInBatches,
  maxRowsPerBatch,
} from "@/db/batchInsert.js";

describe("batchInsert", () => {
  it("sizes batches from the parameter budget", () => {
    expect(maxRowsPerBatch(9, 20_000)).toBe(Math.floor(20_000 / 9));
    expect(maxRowsPerBatch(9)).toBeGreaterThanOrEqual(2000);
    expect(maxRowsPerBatch(0)).toBe(1);
    expect(maxRowsPerBatch(-1)).toBe(1);
  });

  it("returns no chunks for empty input", () => {
    expect(chunkIndices(0, 10)).toEqual([]);
    expect(chunkIndices(10, 0)).toEqual([]);
  });

  it("splits large inserts into multiple batches", async () => {
    const chunks = chunkIndices(10_000, maxRowsPerBatch(9));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].start).toBe(0);
    expect(chunks.at(-1)!.end).toBe(10_000);

    const batches: Array<{ start: number; end: number }> = [];
    await insertInBatches(9000, 9, async (start, end) => {
      batches.push({ start, end });
    });
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.reduce((sum, b) => sum + (b.end - b.start), 0)).toBe(9000);

    for (const batch of batches) {
      expect((batch.end - batch.start) * 9).toBeLessThanOrEqual(20_000);
    }
  });

  it("skips work when rowCount is zero", async () => {
    let called = false;
    await insertInBatches(0, 9, async () => {
      called = true;
    });
    expect(called).toBe(false);
  });
});
