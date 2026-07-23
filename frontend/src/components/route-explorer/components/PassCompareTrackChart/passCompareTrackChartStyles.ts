import { cn } from "../../../../lib/cn";
import { textStyles } from "../../../ui/Text/Text.styles";

export const passCompareTrackChartStyles = {
  legend: "flex flex-col gap-1.5",
  legendItem: cn(textStyles.muted, "flex min-w-0 items-center gap-2 text-[0.72rem]"),
  legendItemLarge: "text-[0.82rem]",
  legendIndex:
    "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-semibold tabular-nums text-[#0f1419]",
  legendLinePreview: "h-0 w-5 shrink-0 border-t-[2.5px]",
  endMarker:
    "pointer-events-none absolute z-20 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[0.58rem] font-semibold tabular-nums text-[#0f1419] shadow-[0_0_0_1px_#0f1419,0_0_0_2px_#e8edf5]",
  passLegendGrid: "grid items-center gap-x-2 gap-y-1.5 overflow-x-auto text-[0.68rem] tabular-nums",
  passLegendGridLarge: "text-[0.8rem]",
  zoneGridHead: cn(
    textStyles.muted,
    "flex items-center justify-center gap-1 px-1 py-0.5 font-medium whitespace-nowrap",
  ),
  zoneGridZoneSwatch: "h-2 w-2 shrink-0 rounded-sm opacity-80",
  zoneGridCell: cn(
    textStyles.muted,
    "rounded px-1.5 py-0.5 text-center whitespace-nowrap",
  ),
  zoneGridCellEmpty: "text-fg/25",
} as const;