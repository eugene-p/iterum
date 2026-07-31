import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const activityHeaderMetricsStyles = {
  root: "inline-flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs tabular-nums text-muted",
  metric: "whitespace-nowrap",
  sep: cn(textStyles.muted, "select-none opacity-60"),
} as const;
