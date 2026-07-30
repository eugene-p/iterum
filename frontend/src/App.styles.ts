import { cn } from "./lib/cn";
import { panelStyles } from "./components/ui/Panel/Panel.styles";
import { stackStyles } from "./components/ui/Stack/Stack.styles";

export const SIDEBAR_WIDTH_PX = 320;
export const SIDEBAR_RAIL_WIDTH_PX = 48;

/** Demoted map column for data-centric detail (activity + segment). */
export const DETAIL_MAP_PANE_WIDTH_PX = 360;

const flexColFill = "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export const appStyles = {
  root: "fixed inset-0 flex min-h-0 overflow-hidden",
  main: "flex min-h-0 min-w-0 flex-1 flex-col overflow-clip",
  segmentDetail: flexColFill,
  /**
   * Data-centric detail body: primary content + demoted map side-by-side.
   * Create/compare stay map-centric elsewhere.
   */
  detailBody: "flex min-h-0 min-w-0 flex-1 overflow-hidden",
  /** Scrollable data column (stats, pass/stretch tables). */
  detailPrimary:
    "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain [overflow-anchor:none]",
  /** Fixed demoted map rail — always visible, expand via pane control. */
  detailMapPane:
    "relative flex w-[360px] min-h-0 shrink-0 flex-col overflow-hidden border-l border-border bg-map",
  screenOutlet: flexColFill,
  detailScreen: flexColFill,

  segmentMode:
    "flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-drop-surface px-3 py-2",
  segmentModeInfo: "flex min-w-0 flex-1 flex-wrap items-center gap-3",
  segmentModeActivity: "inline-flex flex-wrap items-center gap-2",
  segmentActions: "ml-auto flex flex-wrap items-center gap-2",
  emptyMain: "m-4 flex min-h-80 flex-1 flex-col items-center justify-center",
  segmentEditorPanel: cn(stackStyles.stack, panelStyles.root, panelStyles.flush),
} as const;
