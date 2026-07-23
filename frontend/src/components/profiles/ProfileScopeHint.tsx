import { useProfileContext } from "../../app/ProfileContext";
import { cn } from "../../lib/cn";
import { profileScopeStyles } from "./profileScope.styles";

type ProfileScopeHintProps = {
  className?: string;
};

export const ProfileScopeHint = ({ className }: ProfileScopeHintProps) => {
  const { viewScope } = useProfileContext();
  if (viewScope !== "all") return null;

  return <p className={cn(profileScopeStyles.hint, className)}>All profiles</p>;
};