import { Badge, Card, Select } from "../../ui";
import type { SegmentBaselines } from "../../../types";
import { formatDuration } from "../../../utils";
import { segmentPerformanceBaselineStyles as styles } from "./SegmentPerformanceBaseline.styles";

const AGGREGATORS = [
  ["all_time", "All time"],
  ["rolling_30d", "30 days"],
  ["rolling_90d", "90 days"],
  ["rolling_365d", "365 days"],
] as const;

type SegmentPerformanceBaselineProps = {
  data: SegmentBaselines;
  aggregationType: string;
  onAggregationTypeChange: (type: string) => void;
};

export const SegmentPerformanceBaseline = ({
  data,
  aggregationType,
  onAggregationTypeChange,
}: SegmentPerformanceBaselineProps) => {
  const stats = data.aggregations[aggregationType] ?? {
    sample_count: 0,
    typical_duration_sec: null,
    best_duration_sec: null,
  };
  const improvement =
    stats.typical_duration_sec != null && stats.typical_duration_sec > 0
      ? ((stats.typical_duration_sec - data.effort_sec) / stats.typical_duration_sec) * 100
      : null;
  const isPr = data.effort_sec === data.aggregations.all_time?.best_duration_sec;
  const isWindowBest = data.effort_sec === stats.best_duration_sec;
  const label = AGGREGATORS.find(([type]) => type === aggregationType)?.[1] ?? aggregationType;
  const improvementLabel =
    improvement == null
      ? "—"
      : Math.abs(improvement) < 0.05
        ? "0%"
        : `${Math.abs(improvement).toFixed(1)}% ${improvement > 0 ? "better" : "slower"}`;

  return (
    <Card className={styles.root} aria-label="Segment performance baseline">
      <div className={styles.header}>
        <div className={styles.title}>Historical segment performance</div>
        <Select
          className={styles.selector}
          value={aggregationType}
          aria-label="Baseline window"
          onChange={(event) => onAggregationTypeChange(event.target.value)}
        >
          {AGGREGATORS.map(([type, optionLabel]) => (
            <option key={type} value={type}>
              {optionLabel}
            </option>
          ))}
        </Select>
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.label}>This effort</span>
          <span className={styles.value}>{formatDuration(data.effort_sec)}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>{label} typical</span>
          <span className={styles.value}>{formatDuration(stats.typical_duration_sec)}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Sample count</span>
          <span className={styles.value}>{stats.sample_count}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Compared with typical</span>
          <span className={styles.value}>{improvementLabel}</span>
        </div>
      </div>
      {(isPr || isWindowBest) && (
        <div className={styles.footer}>
          {isPr ? <Badge variant="ok">All-time PR</Badge> : null}
          {!isPr && isWindowBest ? <Badge variant="ok">{label} best</Badge> : null}
        </div>
      )}
      <div className={styles.footer}>Focal effort: {data.as_of_date}</div>
    </Card>
  );
};
