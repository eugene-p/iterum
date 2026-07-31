import { cn } from "../../lib/cn";

export const activityJobFailureNoticeStyles = {
  root: (compact = false) =>
    cn(
      "max-w-full truncate text-center",
      compact ? "text-[0.68rem]" : "text-xs",
    ),
} as const;
