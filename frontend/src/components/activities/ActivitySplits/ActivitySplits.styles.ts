import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

/** Matches ActivityStatsPanel analysis cards (Effort & elevation, matched segments). */
export const activitySplitsStyles = {
  root: "snap-start scroll-mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface p-4",
  header: "flex flex-wrap items-baseline gap-x-3 gap-y-1",
  title: cn(textStyles.muted, "m-0 text-[0.72rem] font-medium uppercase tracking-wide"),
  hint: cn(textStyles.muted, "min-w-0 flex-1 text-xs leading-snug"),
  settingsLink:
    "ml-auto shrink-0 rounded border border-border bg-card px-2 py-1 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:bg-card-active hover:text-fg",
  /** Scrollport for sticky left labels. */
  tableWrap: "max-w-full overflow-x-auto overscroll-x-contain",
  /**
   * border-separate is required for position:sticky on table cells;
   * border-collapse breaks sticky in Chromium/WebKit.
   */
  table: "w-max border-separate border-spacing-0 text-sm tabular-nums",
  cornerCell: cn(
    "sticky left-0 z-20 box-border w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]",
    "border-b border-border/70 bg-surface px-1.5 py-1.5 text-left text-xs font-medium text-muted",
    "shadow-[1px_0_0_0_var(--color-border)]",
  ),
  splitHead: "border-b border-border/70 px-2 py-1.5 text-center text-xs font-medium text-muted",
  metricLabel: cn(
    "sticky left-0 z-10 box-border w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]",
    "border-t border-border/70 bg-surface px-1.5 py-1.5 text-left text-xs font-medium text-muted",
    "shadow-[1px_0_0_0_var(--color-border)]",
  ),
  cell: "border-t border-border/70 px-2 py-1.5 text-center font-medium text-fg whitespace-nowrap",
} as const;
