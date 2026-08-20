export const segmentPerformanceBaselineStyles = {
  root: "flex flex-col gap-3 rounded border border-border bg-surface p-4",
  header: "flex flex-wrap items-center justify-between gap-3",
  title: "text-sm font-semibold text-fg",
  selector: "min-w-28",
  metrics: "grid grid-cols-2 gap-3 sm:grid-cols-4",
  metric: "flex flex-col gap-0.5",
  label: "text-xs text-muted",
  value: "text-sm font-semibold tabular-nums text-fg",
  footer: "text-xs text-muted",
} as const;
