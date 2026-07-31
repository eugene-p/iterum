export const screenPlaceholderStyles = {
  root: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg",
  header:
    "flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-drop-surface px-3 py-3",
  badge: "h-5 w-14 shrink-0 animate-pulse rounded bg-elevated",
  title: "h-4 min-w-0 flex-1 max-w-xs animate-pulse rounded bg-elevated",
  meta: "h-3 w-28 shrink-0 animate-pulse rounded bg-elevated/80",
  action: "ml-auto h-8 w-20 shrink-0 animate-pulse rounded-lg bg-elevated",
  body: "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-3 lg:p-5",
  map: "min-h-[min(48vh,460px)] flex-1 animate-pulse rounded-xl border border-border bg-elevated/60",
  panel: "h-24 shrink-0 animate-pulse rounded-xl border border-border bg-elevated/40",
  line: "h-3 w-2/3 max-w-md animate-pulse rounded bg-elevated/50",
  lineShort: "h-3 w-1/3 max-w-xs animate-pulse rounded bg-elevated/40",
} as const;
