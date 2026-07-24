export const collapsibleSectionStyles = {
  header: "flex items-center gap-2 px-[0.85rem] py-[0.65rem]",
  titleButton:
    "flex min-h-7 min-w-0 flex-1 cursor-pointer items-center border-0 bg-transparent p-0 text-left",
  title: "m-0 text-[1rem] font-semibold leading-none text-subtle",
  meta: "flex shrink-0 items-center leading-none",
  chevronButton:
    "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-muted transition-colors hover:bg-card-active hover:text-subtle",
  chevronIcon: "size-4 shrink-0",
  body: "px-[0.85rem] pb-[0.85rem]",
} as const;
