export const drawerStyles = {
  // Above Leaflet controls/attribution (z-index 1000); below modals (2000).
  backdrop: "fixed inset-0 z-[1500] flex justify-end bg-black/45",
  panel:
    "flex h-full w-[min(420px,92vw)] flex-col overflow-hidden border-l border-border bg-surface",
  panelWide:
    "flex h-full w-[min(640px,96vw)] flex-col overflow-hidden border-l border-border bg-surface",
  panelMap:
    "flex h-full w-[min(720px,98vw)] flex-col overflow-hidden border-l border-border bg-surface",
  header:
    "flex shrink-0 items-center gap-2 border-b border-border px-4 pb-3 pt-4",
  title: "m-0 min-w-0 flex-1 text-[0.95rem] font-semibold text-fg",
  body: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
  footer: "shrink-0 border-t border-border px-4 py-3",
} as const;
