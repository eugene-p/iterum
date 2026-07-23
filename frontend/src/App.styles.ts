import { cn } from "./lib/cn";
import { panelStyles } from "./components/ui/Panel/Panel.styles";
import { stackStyles } from "./components/ui/Stack/Stack.styles";

export const SIDEBAR_WIDTH_PX = 360;
export const SIDEBAR_RAIL_WIDTH_PX = 48;

export const appStyles = {
  root: "fixed inset-0 flex min-h-0 overflow-hidden",
  main: "flex min-h-0 min-w-0 flex-1 flex-col overflow-clip",
  mapWrap: "relative isolate h-[420px] shrink-0 overflow-hidden",
  mapWrapGrow: "min-h-[420px] flex-1 overflow-hidden",
  segmentDetail: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  segmentDetailScroll: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  segmentDetailBody: "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain [overflow-anchor:none]",
  screenOutlet: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  activityContent: "flex min-h-0 min-w-0 flex-1 overflow-hidden",
  detailScreen: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  activityStatsAside: "w-[400px] shrink-0 overflow-auto border-l border-border bg-surface",

  segmentMode:
    "flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-drop-surface px-3 py-2",
  segmentModeInfo: "flex min-w-0 flex-1 flex-wrap items-center gap-3",
  segmentModeActivity: "inline-flex flex-wrap items-center gap-2",
  segmentActions: "ml-auto flex flex-wrap items-center gap-2",
  emptyMain: "m-4 flex min-h-80 flex-1 flex-col items-center justify-center",
  segmentEditorPanel: cn(stackStyles.stack, panelStyles.root, panelStyles.flush),
} as const;