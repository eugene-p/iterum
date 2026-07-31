import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { metricSummaryStyles as styles } from "./MetricSummary.styles";

type MetricSummaryProps = {
  label: string;
  metrics?: ReadonlyArray<{ label: string; value: ReactNode }>;
  tags?: ReactNode;
  metadata?: ReactNode;
  className?: string;
};

/** Compact named data summary for detail screens. Callers supply all domain-specific content. */
export const MetricSummary = ({
  label,
  metrics = [],
  tags,
  metadata,
  className,
}: MetricSummaryProps) => (
  <section className={cn(styles.root, className)} aria-label={label}>
    {tags ? <div className={styles.tags}>{tags}</div> : null}
    {metrics.length > 0 ? (
      <dl className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metric}>
            <dt className={styles.label}>{metric.label}</dt>
            <dd className={styles.value}>{metric.value}</dd>
          </div>
        ))}
      </dl>
    ) : null}
    {metadata ? <div className={styles.metadata}>{metadata}</div> : null}
  </section>
);
