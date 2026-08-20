import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const activitiesPanelStyles = {
  root: "flex min-h-0 w-full flex-1 flex-col",
  body: "min-h-0 flex-1 overflow-y-auto py-3",
  footer: "w-full shrink-0",

  modeRow: "flex items-center gap-1",
  modeButton: (active: boolean) =>
    cn(
      "cursor-pointer rounded-md border px-2 py-[0.28rem] text-[0.72rem] font-medium transition-colors",
      active
        ? "border-primary/40 bg-card-active text-fg"
        : "border-border bg-transparent text-muted hover:bg-card-active hover:text-fg",
    ),

  sortRow: "flex items-center gap-[0.45rem]",
  sortLabel: cn(textStyles.muted, "shrink-0 text-xs"),
  sortSelect: "w-auto min-w-0 flex-1 cursor-pointer px-2 py-[0.3rem] text-[0.75rem]",

  density: "flex flex-col gap-1 px-1",
  densityChrome: "flex items-center gap-1",
  densityNav: cn(
    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border",
    "text-[0.75rem] text-muted transition-colors hover:bg-card-active hover:text-fg",
    "disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted",
  ),
  densityRange: cn(
    textStyles.muted,
    "min-w-0 flex-1 truncate text-center text-[0.7rem] font-medium tabular-nums",
  ),
  densityWeeks: "flex w-full flex-col gap-1.5",
  densityWeekRow: "flex w-full gap-1",
  densityCell: (level: 0 | 1 | 2 | 3 | 4, selected: boolean, empty = false) =>
    cn(
      "min-h-[1.35rem] min-w-0 flex-1 rounded-sm border border-transparent aspect-square max-h-7",
      level === 0 && "bg-border/80",
      level === 1 && "bg-primary/30",
      level === 2 && "bg-primary/50",
      level === 3 && "bg-primary/75",
      level === 4 && "bg-primary",
      selected && "ring-2 ring-fg ring-offset-1 ring-offset-bg",
      empty ? "cursor-default opacity-50" : "cursor-pointer",
    ),
  densityHint: cn(textStyles.muted, "text-[0.65rem] leading-none"),
  dayFilterChip: cn(
    textStyles.muted,
    "flex items-center gap-1.5 px-1 text-[0.72rem]",
  ),
  dayFilterClear:
    "cursor-pointer border-0 bg-transparent p-0 text-[0.72rem] font-medium text-primary underline-offset-2 hover:underline",

  weekHeader: cn(
    textStyles.muted,
    "sticky top-0 z-[1] bg-bg/95 px-2 py-1 text-[0.7rem] font-semibold tracking-wide backdrop-blur-sm",
  ),
  weekHeaderCount: "font-normal opacity-80",

  listItem: (dayStripe: boolean) =>
    cn(
      dayStripe && "bg-drop-surface/70",
    ),
  itemPrimaryRow: "flex min-w-0 items-baseline gap-1",
  itemDateTime: "shrink-0 text-[0.78rem] font-semibold leading-[1.25] tabular-nums text-fg",
  itemSep: "shrink-0 text-[0.7rem] leading-[1.25] text-muted opacity-45",
  itemName: cn(
    textStyles.muted,
    "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] font-medium leading-[1.25]",
  ),
  itemProfile: cn(textStyles.muted, "max-w-[30%] shrink-0 truncate text-[0.65rem] opacity-80"),
  itemStats: cn(
    textStyles.muted,
    "mt-[0.08rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.7rem] font-medium leading-[1.25] text-subtle",
  ),
  itemContext: cn(
    textStyles.muted,
    "mt-[0.06rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.65rem] leading-[1.2] opacity-80",
  ),

  cluster: "border-b border-border",
  clusterHeader: "gap-1 px-1 py-1",
  clusterTitle: "min-w-0 flex-1 font-normal text-inherit",
  clusterTitleText: "block truncate text-[0.8rem] font-semibold text-fg",
  clusterMeta: cn(textStyles.muted, "mt-0.5 block text-[0.68rem] leading-[1.25]"),
  clusterBody: "pb-0.5",
  clusterLoading: cn(textStyles.muted, "px-2 py-3 text-[0.82rem]"),
} as const;
