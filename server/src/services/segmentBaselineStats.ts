export type DurationObservation = {
  date: string;
  durationSec: number;
};

export type DurationBaselineStats = {
  sample_count: number;
  typical_duration_sec: number | null;
  best_duration_sec: number | null;
};

export type SegmentAggregatorWindow =
  | { kind: "all_time" }
  | { kind: "rolling_days"; days: number };

export type SegmentAggregator = {
  type: string;
  label: string;
  window: SegmentAggregatorWindow;
};

export type DurationIndex = {
  values: ReadonlyArray<number>;
  rankFor: (durationSec: number) => number | undefined;
};

class FenwickTree {
  private readonly tree: number[];
  private total = 0;

  public constructor(private readonly size: number) {
    this.tree = Array.from({ length: size + 1 }, () => 0);
  }

  public add(index: number, delta: number): void {
    if (index < 1 || index > this.size) return;
    this.total += delta;
    for (let current = index; current <= this.size; current += current & -current) {
      this.tree[current] += delta;
    }
  }

  public count(): number {
    return this.total;
  }

  /** Return the smallest rank whose cumulative count is at least order. */
  public select(order: number): number {
    if (order < 1 || order > this.total) throw new Error("Fenwick order out of range");
    let index = 0;
    let bit = 1;
    while (bit * 2 <= this.size) bit *= 2;
    for (; bit > 0; bit >>= 1) {
      const next = index + bit;
      if (next <= this.size && this.tree[next] < order) {
        index = next;
        order -= this.tree[next];
      }
    }
    return index + 1;
  }
}

export const createDurationIndex = (
  durations: ReadonlyArray<number>,
): DurationIndex => {
  const values = [...new Set(durations.filter((duration) => Number.isFinite(duration) && duration > 0))]
    .sort((a, b) => a - b);
  const ranks = new Map(values.map((value, index) => [value, index + 1]));
  return {
    values,
    rankFor: (durationSec) => ranks.get(durationSec),
  };
};

export type DurationStatsAccumulator = {
  add: (durationSec: number) => void;
  remove: (durationSec: number) => void;
  snapshot: () => DurationBaselineStats;
};

export const createDurationStatsAccumulator = (
  index: DurationIndex,
): DurationStatsAccumulator => {
  const tree = new FenwickTree(index.values.length);
  const update = (durationSec: number, delta: number) => {
    if (!Number.isFinite(durationSec) || durationSec <= 0) return;
    const rank = index.rankFor(durationSec);
    if (rank == null) return;
    tree.add(rank, delta);
  };

  return {
    add: (durationSec) => update(durationSec, 1),
    remove: (durationSec) => update(durationSec, -1),
    snapshot: () => {
      const sampleCount = tree.count();
      if (sampleCount <= 0) {
        return { sample_count: 0, typical_duration_sec: null, best_duration_sec: null };
      }

      const valueAt = (order: number) => index.values[tree.select(order) - 1];
      const lowerMiddle = valueAt(Math.floor((sampleCount + 1) / 2));
      const upperMiddle = valueAt(Math.ceil((sampleCount + 1) / 2));
      return {
        sample_count: sampleCount,
        typical_duration_sec: (lowerMiddle + upperMiddle) / 2,
        best_duration_sec: valueAt(1),
      };
    },
  };
};
