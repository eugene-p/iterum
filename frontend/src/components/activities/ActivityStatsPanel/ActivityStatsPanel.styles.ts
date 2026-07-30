import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const activityStatsPanelStyles = {
  root: "mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 lg:px-6",
  analysisSection: "snap-start scroll-mt-3 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4",
  sectionHeader: "flex flex-wrap items-baseline justify-between gap-3",
  sectionTitle: cn(textStyles.muted, "text-[0.72rem] font-medium uppercase tracking-wide"),
  summaryLine: "text-[0.82rem] font-medium tabular-nums leading-snug",
  statList: "flex flex-col gap-0",
  statRow:
    "flex items-baseline justify-between gap-3 border-b border-border/70 py-1 last:border-b-0",
  statLabel: cn(textStyles.muted, "shrink-0 text-[0.78rem]"),
  statValue: "text-right text-[0.82rem] font-medium tabular-nums",
  zoneSummary: "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-card px-3 py-2",
  zoneSummaryLabel: "text-xs font-medium text-muted",
  metaLine: cn(textStyles.muted, "text-[0.75rem] leading-snug"),
  segmentHeading: "flex flex-wrap items-baseline justify-between gap-2",
  segmentHint: "text-xs text-muted",
  segmentList: "m-0 flex list-none flex-col gap-2 p-0",
  segmentItem:
    "w-full cursor-pointer rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-border-strong hover:bg-card-active",
  segmentName:
    "overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-tight",
  segmentMeta: cn(textStyles.muted, "mt-1 text-xs leading-tight"),
  segmentAction: "mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary",
  emptyHint: cn(textStyles.muted, "text-[0.78rem] leading-snug"),
} as const;
