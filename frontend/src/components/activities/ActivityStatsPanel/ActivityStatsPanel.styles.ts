import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const activityStatsPanelStyles = {
  root: "flex h-full flex-col gap-3 overflow-auto px-3 py-2.5",
  section: "flex flex-col gap-1.5",
  sectionTitle: cn(textStyles.muted, "text-[0.72rem] font-medium uppercase tracking-wide"),
  tagRow: "flex flex-wrap gap-1",
  summaryLine: "text-[0.82rem] font-medium tabular-nums leading-snug",
  statList: "flex flex-col gap-0",
  statRow:
    "flex items-baseline justify-between gap-3 border-b border-border/70 py-1 last:border-b-0",
  statLabel: cn(textStyles.muted, "shrink-0 text-[0.78rem]"),
  statValue: "text-right text-[0.82rem] font-medium tabular-nums",
  metaLine: cn(textStyles.muted, "text-[0.75rem] leading-snug"),
  segmentList: "m-0 flex list-none flex-col gap-0 p-0",
  segmentItem:
    "w-full cursor-pointer rounded px-1 py-1.5 text-left transition-colors hover:bg-card-active",
  segmentName:
    "overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-medium leading-tight",
  segmentMeta: cn(textStyles.muted, "mt-0.5 text-[0.72rem] leading-tight"),
  emptyHint: cn(textStyles.muted, "text-[0.78rem] leading-snug"),
} as const;