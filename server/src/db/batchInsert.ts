/**
 * Build multi-row INSERT value groups with a fixed parameter budget so we stay
 * under PostgreSQL's ~65535 bind-parameter limit.
 */

export const DEFAULT_MAX_PARAMS_PER_BATCH = 20_000;

export type BatchRowBuilder = {
  /** Append this row's bound values to `values`. */
  pushValues: (values: unknown[]) => void;
  /** Return the `($n,$n+1,...)` placeholder fragment for this row starting at `param`. */
  placeholder: (param: number) => string;
  /** Number of bind parameters consumed by one row. */
  paramsPerRow: number;
};

export function chunkIndices(total: number, chunkSize: number): Array<{ start: number; end: number }> {
  if (total <= 0 || chunkSize <= 0) return [];
  const chunks: Array<{ start: number; end: number }> = [];
  for (let start = 0; start < total; start += chunkSize) {
    chunks.push({ start, end: Math.min(start + chunkSize, total) });
  }
  return chunks;
}

export function maxRowsPerBatch(
  paramsPerRow: number,
  maxParams: number = DEFAULT_MAX_PARAMS_PER_BATCH,
): number {
  if (paramsPerRow <= 0) return 1;
  return Math.max(1, Math.floor(maxParams / paramsPerRow));
}

export async function insertInBatches(
  rowCount: number,
  paramsPerRow: number,
  buildBatch: (start: number, end: number) => Promise<void>,
  maxParams: number = DEFAULT_MAX_PARAMS_PER_BATCH,
): Promise<void> {
  if (rowCount <= 0) return;
  const size = maxRowsPerBatch(paramsPerRow, maxParams);
  for (const { start, end } of chunkIndices(rowCount, size)) {
    await buildBatch(start, end);
  }
}
