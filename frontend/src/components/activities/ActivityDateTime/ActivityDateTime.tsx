import {
  formatActivityDate,
  formatActivityTime,
  resolveActivityDateTime,
  type ActivityDateTimeInput,
} from "../../../activityDisplay";
import { activityDateTimeStyles } from "./ActivityDateTime.styles";

type ActivityDateTimeProps = ActivityDateTimeInput & {
  className?: string;
};

/** Renders an activity's resolved date and time, e.g. "Jan 15 · 10:30". */
export const ActivityDateTime = ({ className, ...input }: ActivityDateTimeProps) => {
  const resolved = resolveActivityDateTime(input);
  if (!resolved) {
    return <span className={activityDateTimeStyles.root(className)}>— · —</span>;
  }

  return (
    <span className={activityDateTimeStyles.root(className)}>
      <span className={activityDateTimeStyles.date}>{formatActivityDate(resolved.at)}</span>
      <span className={activityDateTimeStyles.sep} aria-hidden="true">
        ·
      </span>
      <span className={activityDateTimeStyles.time}>
        {formatActivityTime(resolved.at, resolved.hasTime)}
      </span>
    </span>
  );
};