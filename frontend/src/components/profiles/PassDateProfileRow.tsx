import type { ActivityDateTimeInput } from "../../activityDisplay";
import { useProfileContext } from "../../app/ProfileContext";
import { cn } from "../../lib/cn";
import type { SegmentPass } from "../../types";
import { ActivityDateTime } from "../activities/ActivityDateTime";
import { profileScopeStyles } from "./profileScope.styles";

type PassDateProfileRowProps = ActivityDateTimeInput & {
  pass: Pick<SegmentPass, "profile_name">;
  className?: string;
  dateClassName?: string;
};

export const PassDateProfileRow = ({
  pass,
  className,
  dateClassName,
  ...dateInput
}: PassDateProfileRowProps) => {
  const { viewScope } = useProfileContext();
  const showProfile = viewScope === "all" && pass.profile_name;

  return (
    <div className={cn(profileScopeStyles.dateProfileRow, className)}>
      <ActivityDateTime {...dateInput} className={dateClassName} />
      {showProfile && (
        <span className={profileScopeStyles.dateProfileOwner}>{pass.profile_name}</span>
      )}
    </div>
  );
};