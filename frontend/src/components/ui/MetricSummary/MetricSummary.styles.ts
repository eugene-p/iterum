import { cn } from "../../../lib/cn";
import { textStyles } from "../Text/Text.styles";

export const metricSummaryStyles = {
  root:
    "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-border bg-surface px-4 py-2.5",
  tags: "flex flex-wrap items-center gap-1.5",
  metrics: "flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1.5",
  metric: "inline-flex items-baseline gap-1 whitespace-nowrap",
  label: cn(textStyles.muted, "text-xs"),
  value: "text-sm font-semibold tabular-nums text-fg",
  metadata: cn(textStyles.muted, "ml-auto text-xs leading-snug"),
} as const;
