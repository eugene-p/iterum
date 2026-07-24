export const collapsibleSectionStyles = {
  variant: {
    bare: "",
    card: "overflow-hidden rounded-[10px] border border-border bg-card",
    panel: "overflow-hidden border-t border-border bg-surface",
  },
  header: "flex items-center gap-1.5 px-3 py-[0.35rem]",
  titleButton:
    "flex min-h-6 min-w-0 flex-1 cursor-pointer items-center border-0 bg-transparent p-0 text-left",
  title: "m-0 text-[0.9rem] font-semibold leading-none text-subtle",
  meta: "flex shrink-0 items-center text-[0.78rem] leading-none text-muted",
  chevronButton:
    "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-muted transition-colors hover:bg-card-active hover:text-subtle",
  chevronIcon: "size-3.5 shrink-0",
  body: "flex flex-col gap-2 px-3 pb-[0.55rem]",
} as const;
