export const dropdownMenuStyles = {
  triggerContent: "inline-flex items-center gap-1",
  chevron: "text-[0.7rem] text-muted",
  menu:
    "fixed z-[1300] min-w-[10rem] overflow-hidden rounded-lg border border-border-strong bg-card py-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)]",
  groupLabel: "px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-muted",
  divider: "my-1 border-t border-border",
  item:
    "flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-sm text-fg transition-colors hover:bg-elevated-hover disabled:cursor-not-allowed disabled:opacity-50",
  itemDanger: "text-danger hover:bg-danger-surface",
} as const;