import { cn } from "../../lib/cn";

export const appSidebarRailStyles = {
  root: cn(
    "flex h-full w-[48px] shrink-0 min-h-0 flex-col items-center gap-2 overflow-hidden",
    "border-r border-border bg-surface py-3",
  ),
  tab: cn(
    "flex size-9 cursor-pointer items-center justify-center rounded-md border-none bg-transparent",
    "text-muted transition-colors hover:bg-drop-surface hover:text-highlight",
  ),
  tabActive: "bg-drop-surface text-highlight",
  divider: "h-px w-6 shrink-0 bg-border",
} as const;