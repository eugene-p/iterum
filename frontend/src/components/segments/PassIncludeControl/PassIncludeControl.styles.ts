import { cn } from "../../../lib/cn";
import { inputStyles } from "../../ui/Input/Input.styles";
import { textStyles } from "../../ui/Text/Text.styles";

/** Above modal backdrop (z-2000) so the picker works inside Route Explorer. */
const POPOVER_Z = "z-[2100]";

export const passIncludeControlStyles = {
  root: "flex flex-col gap-2",
  /** Single horizontal strip — never wrap chips to extra rows. */
  bar: "flex min-w-0 flex-nowrap items-center gap-2",
  meta: cn(textStyles.muted, "shrink-0 text-[0.78rem]"),
  chips: "flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden",
  chip: "inline-flex max-w-[9rem] shrink-0 items-center gap-1 rounded-md border border-border bg-elevated px-1.5 py-[0.15rem] text-[0.72rem] text-fg",
  chipDot: "size-2 shrink-0 rounded-full",
  chipLabel: "min-w-0 truncate font-medium",
  chipMeta: cn(textStyles.muted, "shrink-0 text-[0.68rem]"),
  chipRemove:
    "shrink-0 cursor-pointer rounded px-0.5 text-muted transition-colors hover:bg-elevated-hover hover:text-fg",
  chipOverflow:
    "inline-flex shrink-0 cursor-pointer items-center rounded-md border border-border bg-elevated px-1.5 py-[0.15rem] text-[0.72rem] font-medium text-muted transition-colors hover:bg-elevated-hover hover:text-fg",
  barActions: "flex shrink-0 flex-nowrap items-center gap-1.5",
  simpleList: "flex flex-col gap-1",
  row: "flex items-start gap-2 rounded-md border border-border bg-card px-2 py-1.5",
  rowBody: "min-w-0 flex-1",
  rowTitle: "text-[0.82rem] font-semibold leading-[1.25] text-fg",
  rowMeta: cn(textStyles.muted, "mt-[0.1rem] flex flex-wrap gap-x-2 gap-y-0.5 text-[0.72rem]"),
  popover: cn(
    "fixed flex max-h-[min(70vh,520px)] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-border-strong bg-card shadow-[0_12px_32px_rgba(0,0,0,0.5)]",
    POPOVER_Z,
  ),
  popoverHead: "flex flex-col gap-2 border-b border-border px-2.5 py-2",
  popoverTools: "flex flex-wrap items-center gap-1.5",
  search: cn(inputStyles.root, "min-w-0 flex-1 px-2 py-[0.35rem] text-[0.82rem]"),
  sort: cn(inputStyles.root, "w-auto shrink-0 px-2 py-[0.35rem] text-[0.78rem]"),
  modes: "flex flex-wrap gap-1",
  modeBtn: "text-[0.72rem]",
  popoverList: "min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5",
  groupLabel:
    "px-1.5 py-1 text-[0.68rem] font-semibold tracking-wide text-muted uppercase",
  empty: cn(textStyles.muted, "px-2 py-3 text-[0.78rem]"),
} as const;
