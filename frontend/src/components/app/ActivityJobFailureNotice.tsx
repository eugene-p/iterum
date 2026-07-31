import { Badge } from "../ui";
import { activityJobFailureNoticeStyles } from "./ActivityJobFailureNotice.styles";

type ActivityJobFailureNoticeProps = {
  failedCount: number;
  compact?: boolean;
};

export const ActivityJobFailureNotice = ({
  failedCount,
  compact = false,
}: ActivityJobFailureNoticeProps) => {
  if (failedCount <= 0) return null;

  const label =
    failedCount === 1
      ? "1 failed background job"
      : `${failedCount} failed background jobs`;

  return (
    <Badge
      variant="warn"
      className={activityJobFailureNoticeStyles.root(compact)}
      role="status"
      title={label}
    >
      {label}
    </Badge>
  );
};
