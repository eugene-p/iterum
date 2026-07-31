import { useMemo } from "react";
import type { Profile, TrackPoint } from "../../../types";
import {
  buildActivitySplits,
  formatSplitDistance,
  formatSplitInterval,
  formatSplitPace,
  splitIntervalM,
  splitUnitLabel,
  type ActivitySplit,
} from "../../../lib/activitySplits";
import { formatDuration, formatHr } from "../../../utils";
import { activitySplitsStyles as styles } from "./ActivitySplits.styles";

type ActivitySplitsProps = {
  points?: TrackPoint[];
  profile?: Profile;
  onOpenProfileSettings?: () => void;
};

type MetricRow = {
  key: string;
  label: string;
  title: string;
  value: (split: ActivitySplit) => string;
};

export const ActivitySplits = ({ points, profile, onOpenProfileSettings }: ActivitySplitsProps) => {
  const interval = splitIntervalM(profile);
  const splits = useMemo(() => buildActivitySplits(points ?? [], interval), [points, interval]);
  const unit = profile?.distance_unit ?? "km";

  const metricRows = useMemo<MetricRow[]>(
    () => [
      {
        key: "distance",
        label: "Distance",
        title: "Split distance",
        value: (split) => formatSplitDistance(split.distance_m, unit),
      },
      {
        key: "time",
        label: "Time",
        title: "Split duration",
        value: (split) => formatDuration(split.duration_sec),
      },
      {
        key: "pace",
        label: "Pace",
        title: "Split pace",
        value: (split) => formatSplitPace(split.duration_sec, split.distance_m, unit),
      },
      {
        key: "avgHr",
        label: "Avg HR",
        title: "Average heart rate for split",
        value: (split) => formatHr(split.avg_hr),
      },
    ],
    [unit],
  );

  if (!points?.length || splits.length === 0) return null;

  return (
    <section className={styles.root} aria-labelledby="activity-splits-title">
      <div className={styles.header}>
        <h2 id="activity-splits-title" className={styles.title}>
          Derived splits
        </h2>
        <span className={styles.hint}>
          Every {formatSplitInterval(interval, unit)} · GPS track · scroll for more splits
        </span>
        {onOpenProfileSettings ? (
          <button type="button" className={styles.settingsLink} onClick={onOpenProfileSettings}>
            Split defaults · {splitUnitLabel(unit)}
          </button>
        ) : null}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.cornerCell}>
                Split
              </th>
              {splits.map((split) => (
                <th key={split.index} scope="col" className={styles.splitHead}>
                  {split.index}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricRows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className={styles.metricLabel} title={row.title}>
                  {row.label}
                </th>
                {splits.map((split) => (
                  <td key={split.index} className={styles.cell} title={row.title}>
                    {row.value(split)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
