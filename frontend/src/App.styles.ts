import { cn } from "./lib/cn";
import { panelStyles } from "./components/ui/Panel/Panel.styles";
import { stackStyles } from "./components/ui/Stack/Stack.styles";

export const SIDEBAR_WIDTH_PX = 320;
export const SIDEBAR_RAIL_WIDTH_PX = 48;

const flexColFill = "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export const appStyles = {
  root: "fixed inset-0 flex min-h-0 overflow-hidden",
  main: "flex min-h-0 min-w-0 flex-1 flex-col overflow-clip",
  segmentDetail: flexColFill,
  /** Detail pages tell a route story vertically instead of reserving a narrow map rail. */
  activityDetailBody:
    "min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain snap-y snap-proximity [overflow-anchor:none]",
  screenOutlet: flexColFill,
  detailScreen: flexColFill,

  emptyMain: "m-4 flex min-h-80 flex-1 flex-col items-center justify-center",
  segmentEditorPanel: cn(stackStyles.stack, panelStyles.root, panelStyles.flush),
} as const;
