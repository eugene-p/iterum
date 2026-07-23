import { cn } from "../../lib/cn";
import { stackStyles } from "../ui/Stack/Stack.styles";

export const appSidebarStyles = {
  root: cn(
    stackStyles.stack,
    "h-full w-[360px] shrink-0 min-h-0 gap-3 overflow-hidden border-r border-border bg-surface p-4",
  ),
  tabs: "flex min-h-0 flex-1 flex-col",
  tabBarRow: "-mx-4 flex shrink-0 items-end gap-1 border-b border-border px-4",
  tabBar: "min-w-0 flex-1 border-b-0",
  collapseButton: cn(
    "relative -mb-px flex size-6 shrink-0 cursor-pointer items-center justify-center",
    "rounded-t-md border border-transparent text-muted",
    "transition-[color,background-color,border-color]",
    "hover:border-border/50 hover:bg-elevated/30 hover:text-highlight",
  ),
  collapseIcon: "mb-[2px] size-4",
  tabContent: "flex min-h-0 flex-1 flex-col overflow-hidden",
  profileTab: "px-2",
  profileTabIcon: "size-4",
} as const;