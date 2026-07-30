import { cn } from "../../../lib/cn";

export const stretchStripEditorStyles = {
  root: "flex flex-col gap-3 rounded border border-border bg-surface/40 p-3 outline-none",
  header: "flex flex-wrap items-center justify-between gap-2",
  title: "m-0 text-[0.9rem] font-semibold text-fg",
  headerActions: "flex flex-wrap items-center gap-2",
  stripWrap: "relative",
  /** Continuous track: cells sized by length, handles absolutely positioned. */
  track: "relative grid min-h-[4.5rem] w-full items-stretch gap-0",
  stripSimple: "grid grid-cols-3 items-stretch gap-1.5",
  cell: (opts: {
    active?: boolean;
    dim?: boolean;
    clickable?: boolean;
    mergeTarget?: boolean;
  }) =>
    cn(
      "relative flex min-h-[4.5rem] min-w-0 flex-col justify-center gap-0.5 border px-2 py-2 text-[0.75rem]",
      opts.active
        ? "border-accent bg-accent/10 text-fg"
        : "border-border/70 bg-surface text-muted",
      opts.dim && "opacity-45",
      opts.clickable && "cursor-pointer transition-colors hover:border-accent/60 hover:bg-accent/5",
      opts.mergeTarget && "border-dashed border-accent/70 bg-accent/5",
    ),
  cellLabel: "font-medium leading-tight",
  cellMeta: "text-[0.68rem] opacity-80",
  /** Absolute grip on a track; left% set inline from path distance. */
  handle: cn(
    "absolute top-1 bottom-1 z-10 w-2.5 -translate-x-1/2 cursor-ew-resize select-none",
    "rounded-sm border border-accent/80 bg-accent shadow-sm",
    "hover:bg-accent/90 active:bg-accent",
    "touch-none",
  ),
  actionBar: cn(
    "absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-[calc(100%+0.35rem)]",
    "items-center gap-0.5 rounded-md border border-border bg-drop-surface p-0.5 shadow-md",
  ),
  actionBtn: (active?: boolean) =>
    cn(
      "inline-flex h-7 min-w-7 items-center justify-center rounded border-0 bg-transparent px-1.5 text-[0.68rem] font-semibold",
      "text-muted transition-colors hover:bg-accent/15 hover:text-fg",
      "disabled:cursor-not-allowed disabled:opacity-40",
      active && "bg-accent/20 text-fg",
    ),
  hint: "m-0 text-[0.75rem] text-muted",
  /** Toast-style merge nudge after a stretch hits min length. */
  nudgeToast: cn(
    "flex flex-wrap items-center gap-2 rounded-md border border-accent/40",
    "bg-drop-surface px-3 py-2 text-[0.78rem] text-fg shadow-md",
  ),
  nudgeText: "m-0 min-w-0 flex-1 leading-snug",
  nudgeActions: "flex flex-wrap items-center gap-1.5",
  convertRow: "flex flex-wrap items-center gap-2 border-t border-border/60 pt-2",
  /**
   * Stretch edit workspace:
   * | map (wide) | list (narrow) |
   * | editor (full width)        |
   */
  workspace: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  workspaceTop:
    "flex min-h-0 min-w-0 flex-[1.4] overflow-hidden border-b border-border",
  workspaceMap:
    "relative flex min-h-0 min-w-0 flex-[2] flex-col overflow-hidden bg-map",
  workspaceList:
    "flex w-[min(22rem,34%)] min-h-0 shrink-0 flex-col overflow-y-auto overscroll-y-contain border-l border-border bg-surface p-2",
  workspaceListTable: "w-full border-collapse text-[0.75rem]",
  workspaceListTh:
    "border-b border-border px-1.5 py-0.5 text-left font-medium text-muted",
  workspaceListTd: "border-b border-border/60 px-1.5 py-0.5 align-middle",
  workspaceListNameInput: cn(
    "w-full min-w-[6rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-[0.75rem] text-fg",
    "hover:border-border focus:border-accent focus:outline-none",
  ),
  workspaceListRow: (selected: boolean) =>
    selected
      ? "cursor-pointer bg-accent/10"
      : "cursor-pointer hover:bg-accent/5",
  workspaceEditor:
    "flex min-h-0 min-w-0 shrink-0 flex-col overflow-y-auto overscroll-y-contain border-t border-border p-2",
} as const;
