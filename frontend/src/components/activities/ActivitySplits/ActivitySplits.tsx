import { useMemo } from "react";
import type { Profile, TrackPoint } from "../../../types";
import {
  buildActivitySplits,
  formatSplitDistance,
  formatSplitInterval,
  formatSplitPace,
  splitIntervalM,
  splitUnitLabel,
} from "../../../lib/activitySplits";
import { formatDuration, formatHr } from "../../../utils";
import { activitySplitsStyles as styles } from "./ActivitySplits.styles";

type ActivitySplitsProps = {
  points?: TrackPoint[];
  profile?: Profile;
  onOpenProfileSettings?: () => void;
};

export const ActivitySplits = ({ points, profile, onOpenProfileSettings }: ActivitySplitsProps) => {
  const interval = splitIntervalM(profile);
  const splits = useMemo(() => buildActivitySplits(points ?? [], interval), [points, interval]);
  const unit = profile?.distance_unit ?? "km";

  if (!points?.length || splits.length === 0) return null;

  return (
    <section className={styles.root} aria-labelledby="activity-splits-title">
      <div className={styles.header}>
        <div>
          <h2 id="activity-splits-title" className={styles.title}>Derived splits</h2>
          <p className={styles.hint}>
            Every {formatSplitInterval(interval, unit)} · derived from the GPS track
          </p>
        </div>
        {onOpenProfileSettings ? (
          <button type="button" className={styles.settingsLink} onClick={onOpenProfileSettings}>
            Split defaults · {splitUnitLabel(unit)}
          </button>
        ) : null}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Split</th><th>Distance</th><th>Time</th><th>Pace</th><th>Avg HR</th></tr>
          </thead>
          <tbody>
            {splits.map((split) => (
              <tr key={split.index}>
                <th scope="row">{split.index}</th>
                <td>{formatSplitDistance(split.distance_m, unit)}</td>
                <td>{formatDuration(split.duration_sec)}</td>
                <td>{formatSplitPace(split.duration_sec, split.distance_m, unit)}</td>
                <td>{formatHr(split.avg_hr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
