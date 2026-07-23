import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export type ActivityTrackChartSize = "compact" | "large";

export const activityTrackChartStyles = {
  root: "flex flex-col gap-1.5",
  rootLarge: "min-h-0 flex-1 gap-2",
  chartWrap: "relative overflow-hidden rounded-md border border-border bg-card",
  chartWrapCompact: "h-[150px]",
  chartWrapLarge: "min-h-[min(55vh,520px)] flex-1",
  chartWrapExpandableHover:
    "transition-colors group-hover:border-border-strong group-hover:bg-card-active",
  chartWrapInteractive: "cursor-crosshair touch-none",
  chartWrapHoverProbe: "cursor-crosshair",
  hoverTooltip:
    "pointer-events-none absolute z-10 rounded border border-border bg-card/95 px-2 py-1 text-[0.78rem] font-medium tabular-nums text-fg shadow-sm",
  hoverTooltipLarge: "text-[0.88rem]",
  hoverOverlay: "pointer-events-none absolute inset-0 z-30",
  hoverDot:
    "absolute block shrink-0 box-border -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e85d6a] shadow-[0_0_0_1px_#e8edf5,0_0_0_2px_#0f1419]",
  expandButton: cn(
    textStyles.muted,
    "absolute right-1.5 bottom-1.5 z-40 rounded border border-border bg-card/95 px-1.5 py-0.5 text-[0.65rem] font-medium text-fg shadow-sm transition-colors hover:border-border-strong hover:bg-card-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
  ),
  expandHint: cn(
    textStyles.muted,
    "pointer-events-none absolute right-1.5 bottom-1.5 rounded bg-card/90 px-1.5 py-0.5 text-[0.65rem] opacity-0 transition-opacity group-hover:opacity-100",
  ),
  svg: "block h-full w-full",
  svgInteractive: "cursor-crosshair touch-none",
  overlayLabels: "pointer-events-none absolute inset-0",
  gridLabel: cn(textStyles.muted, "absolute right-1 -translate-y-1/2 tabular-nums"),
  gridLabelCompact: "text-[0.62rem]",
  gridLabelLarge: "text-[0.78rem]",
  legend: "flex flex-wrap items-center gap-x-3 gap-y-1",
  legendItem: cn(textStyles.muted, "flex items-center gap-1 text-[0.72rem]"),
  legendItemLarge: "text-[0.82rem]",
  legendHr: "h-0.5 w-3 rounded-full bg-[#e85d6a]",
  legendElev: "h-2 w-3 rounded-sm bg-[#4a5568]/80",
  zoneTimeSummary: "flex flex-wrap items-center gap-x-2.5 gap-y-1",
  zoneTimeSummaryCompact: "text-[0.68rem]",
  zoneTimeSummaryLarge: "text-[0.8rem]",
  zoneTimeItem: cn(textStyles.muted, "inline-flex items-center gap-1 tabular-nums"),
  zoneTimeSwatch: "h-2 w-2 shrink-0 rounded-sm opacity-80",
  zoneTimeValue: "inline-flex items-center gap-0.5",
  zoneTimeSeriesDot: "h-2 w-2 shrink-0 rounded-full",
  axisLabel: cn(textStyles.muted, "pointer-events-none absolute tabular-nums"),
  axisLabelCompact: "text-[0.68rem]",
  axisLabelLarge: "text-[0.82rem]",
  axisLeft: "left-1.5 top-1.5",
  axisLeftBottom: "bottom-1.5 left-1.5",
  axisRight: "top-1.5 right-1.5",
  axisRightBottom: "bottom-1.5 right-1.5",
  modalPanel: "flex h-[min(92vh,900px)] w-[min(1200px,96vw)] flex-col",
  modalBody: "flex min-h-0 flex-1 flex-col",
} as const;