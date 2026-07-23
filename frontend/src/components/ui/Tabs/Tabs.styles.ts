import { cn } from "../../../lib/cn";

export const tabsStyles = {
  panel: "py-3",
  list: "flex shrink-0 items-end gap-0 border-b border-border",
  tab: (active: boolean) =>
    cn(
      "relative -mb-px cursor-pointer rounded-t-md border border-transparent px-2.5 py-1 text-[0.75rem] font-normal text-muted transition-[color,background-color,border-color]",
      !active && "hover:border-border/50 hover:bg-elevated/30 hover:text-fg",
      active &&
        "z-[1] border-border border-b-surface bg-surface font-medium text-fg",
    ),
} as const;