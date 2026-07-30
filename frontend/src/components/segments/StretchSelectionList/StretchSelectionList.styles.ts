import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const stretchSelectionListStyles = {
  root: "flex min-h-0 flex-col",
  header: "flex items-start justify-between gap-2 border-b border-border px-3 py-2",
  title: "m-0 text-sm font-semibold text-fg",
  description: cn(textStyles.muted, "mt-0.5 text-[0.72rem] leading-snug"),
  meta: cn(textStyles.muted, "text-xs"),
  headerActions: "flex shrink-0 flex-col items-end gap-1",
  list: "m-0 flex list-none flex-col gap-1 p-2",
  item:
    "flex w-full cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-2 text-left transition-colors hover:border-border hover:bg-card-active",
  itemSelected: "border-accent/50 bg-accent/10",
  number: "mt-px flex size-6 shrink-0 self-start items-center justify-center rounded bg-elevated text-xs font-semibold tabular-nums text-subtle",
  body: "flex min-w-0 flex-1 flex-col",
  name: "block truncate text-xs font-semibold leading-6 text-fg",
  details: cn(textStyles.muted, "mt-1 block text-[0.72rem] leading-tight tabular-nums"),
  state: "shrink-0 text-[0.68rem] font-medium text-accent",
  empty: cn(textStyles.muted, "px-3 py-4 text-xs leading-relaxed"),
} as const;
