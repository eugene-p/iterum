export const entityEditDrawerStyles = {
  form: "flex min-h-0 flex-col gap-3",
  mapDrawerBody: "flex min-h-0 flex-1 flex-col overflow-hidden",
  mapDrawerForm: "flex min-h-0 flex-1 flex-col gap-3",
  scrollForm: "flex flex-col gap-3",
  select: "rounded-md bg-surface px-2 py-1.5 text-sm",
  footerActions: "flex items-center justify-end gap-2",
  mapWrap: "relative z-0 min-h-[240px] flex-1 overflow-hidden rounded-md border border-border bg-map",

  segmentAdjustSection: "relative z-10 flex flex-col gap-1.5 overflow-visible",
  segmentAdjustRow: "flex flex-wrap items-end gap-2",
  segmentAdjustHint: "flex h-9 shrink-0 items-center",
  segmentAdjustHintPopover: "left-auto right-0 translate-x-0",
  segmentAdjustLabelRow: "flex items-center gap-1",
  segmentAdjustButton: "inline-flex h-8 shrink-0 items-center px-[0.55rem] text-sm",
  segmentAdjustField: "flex min-w-[6.5rem] flex-col gap-0.5",
  segmentAdjustInput: "h-8 w-full min-w-0 text-sm",
  pickNotice: "text-xs text-muted",

  /** Single compact toolbar row for path + match settings. */
  pathToolbar: "flex min-h-8 flex-wrap items-center gap-x-2 gap-y-1.5",
  pathToolbarMain: "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
  pathMarker:
    "inline-flex items-center gap-1 text-sm font-medium text-fg",
  pathMarkerDotStart:
    "inline-block size-2 shrink-0 rounded-full bg-[#5fd38d]",
  pathMarkerDotEnd:
    "inline-block size-2 shrink-0 rounded-full bg-[#ff8f8f]",
  pathMapPrompt:
    "inline-flex min-h-8 items-center rounded-md border border-dashed border-primary/60 bg-primary/15 px-2.5 text-sm font-medium text-fg",
  pathEndStep: "flex min-w-0 flex-col gap-1",
  pathDisclaimer: "text-xs text-muted",
  pathDone: "text-sm text-muted",
  matchRow: "ml-auto flex shrink-0 flex-wrap items-end justify-end gap-2",

  dangerZone: "rounded-md border border-danger/30 bg-danger/5 p-3",
  dangerText: "text-sm text-muted",
} as const;
