import type { SegmentAggregator } from "./segmentBaselineStats.js";

export const SEGMENT_AGGREGATORS: ReadonlyArray<SegmentAggregator> = [
  { type: "all_time", label: "All time", window: { kind: "all_time" } },
  { type: "rolling_30d", label: "30 days", window: { kind: "rolling_days", days: 30 } },
  { type: "rolling_90d", label: "90 days", window: { kind: "rolling_days", days: 90 } },
  { type: "rolling_365d", label: "365 days", window: { kind: "rolling_days", days: 365 } },
];

export const listSegmentAggregators = (): ReadonlyArray<SegmentAggregator> =>
  SEGMENT_AGGREGATORS.map((aggregator) => ({
    ...aggregator,
    window: { ...aggregator.window },
  }));

export const assertKnownSegmentAggregationTypes = (
  types: ReadonlyArray<string>,
): ReadonlyArray<SegmentAggregator> => {
  if (!types.length) throw new Error("aggregationTypes must not be empty");
  const byType = new Map(listSegmentAggregators().map((aggregator) => [aggregator.type, aggregator]));
  const aggregators = types.map((type) => {
    const aggregator = byType.get(type);
    if (!aggregator) throw new Error(`Unknown segment aggregation type: ${type}`);
    return aggregator;
  });
  return [...new Map(aggregators.map((aggregator) => [aggregator.type, aggregator])).values()];
};
