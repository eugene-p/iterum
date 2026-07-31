import type { ActivitySummary } from "../../../types";
import { formatDistance, formatDuration, formatHr } from "../../../utils";
import { activityHeaderMetricsStyles as styles } from "./ActivityHeaderMetrics.styles";

type ActivityHeaderMetricsProps = {
  activity: ActivitySummary;
};

const Metric = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <span className={styles.metric} title={label}>
    <span className="sr-only">{label}: </span>
    {value}
  </span>
);

export const ActivityHeaderMetrics = ({ activity }: ActivityHeaderMetricsProps) => (
  <span className={styles.root} role="group" aria-label="Activity metrics">
    <Metric label="Distance" value={formatDistance(activity.distance_m)} />
    <span className={styles.sep} aria-hidden="true">
      ·
    </span>
    <Metric label="Duration" value={formatDuration(activity.duration_sec)} />
    <span className={styles.sep} aria-hidden="true">
      ·
    </span>
    <Metric label="Average heart rate" value={formatHr(activity.avg_hr)} />
  </span>
);
