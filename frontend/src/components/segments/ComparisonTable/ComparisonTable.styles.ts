import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const comparisonTableStyles = {
  table: "w-full border-collapse text-sm",
  th: "border-b border-border px-2 py-2 text-left font-semibold text-subtle",
  td: "border-b border-border px-2 py-2 text-left",

  row: (active: boolean, unmatched?: boolean) =>
    cn(
      active && "bg-card-active shadow-[inset_3px_0_0_theme(--color-primary)]",
      unmatched && "opacity-[0.72]",
    ),

  best: (isBest: boolean) => cn(isBest && "font-semibold text-success"),
  cellName: "leading-[1.25] font-semibold",
  empty: textStyles.muted,
} as const;