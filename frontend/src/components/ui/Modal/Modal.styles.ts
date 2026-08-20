export const modalStyles = {
  backdrop: "fixed inset-0 z-[2000] flex items-stretch justify-center bg-black/55 p-4",
  panel:
    "flex max-h-full w-full flex-col gap-2 overflow-auto rounded-xl border border-border bg-surface p-3",
  header: "flex items-center gap-2 border-b border-border pb-2",
  headerLead: "flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden",
  title: "m-0 shrink-0 text-[0.9rem] font-semibold text-fg",
} as const;
