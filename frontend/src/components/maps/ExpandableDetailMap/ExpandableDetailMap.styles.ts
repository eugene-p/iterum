import { cn } from "../../../lib/cn";

export const expandableDetailMapStyles = {
  root: "relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  mapSurface: "relative min-h-0 min-w-0 flex-1 overflow-hidden",
  expandBtn: cn(
    "absolute right-2 top-2 z-[500] rounded-md border border-border bg-surface/95",
    "px-2 py-1 text-xs font-medium text-fg shadow-sm backdrop-blur-sm",
    "hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ),
  modalPanel: cn(
    "flex h-[min(94vh,960px)] w-[min(1400px,98vw)] flex-col gap-2 overflow-hidden p-3",
  ),
  modalBody: "flex min-h-0 flex-1 flex-col",
  modalMap:
    "relative min-h-[min(70vh,720px)] flex-1 overflow-hidden rounded-md border border-border bg-map",
} as const;
