import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const activitySplitsStyles = {
  root: "snap-start scroll-mt-3 rounded-xl border border-border bg-surface p-4",
  header: "mb-3 flex items-start justify-between gap-3",
  title: "text-sm font-semibold text-fg",
  hint: cn(textStyles.muted, "mt-0.5 text-xs"),
  settingsLink:
    "rounded border border-border bg-card px-2 py-1 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:bg-card-active hover:text-fg",
  tableWrap: "overflow-x-auto",
  table:
    "w-full min-w-[470px] border-collapse text-left text-sm tabular-nums [&_td]:border-t [&_td]:border-border/70 [&_td]:py-2 [&_td]:pr-4 [&_th]:border-t [&_th]:border-border/70 [&_th]:py-2 [&_th]:pr-4 [&_thead_th]:border-t-0 [&_thead_th]:text-xs [&_thead_th]:font-medium [&_thead_th]:text-muted",
} as const;
