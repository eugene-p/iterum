export const createSegmentScreenStyles = {
  root: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  header: "flex h-9 shrink-0 items-center gap-3 border-b border-border px-3",
  back:
    "shrink-0 appearance-none border-0 bg-transparent p-0 text-[0.78rem] font-normal leading-none text-muted shadow-none ring-0 outline-none hover:text-fg hover:underline hover:underline-offset-2 focus-visible:underline focus-visible:underline-offset-2 focus-visible:outline-none",
  sep: "shrink-0 text-[0.82rem] text-muted",
  headerLead: "flex min-w-0 flex-1 items-center gap-x-1.5 overflow-hidden",
  title: "m-0 shrink-0 text-[0.82rem] font-semibold leading-none text-fg",
  actions: "ml-auto flex shrink-0 items-center gap-1.5",
  actionBtn: "h-7 min-h-0 rounded-md px-2 py-0 text-[0.72rem] leading-none",
  form: "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 py-3",
} as const;
