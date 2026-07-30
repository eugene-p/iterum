import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const routeWorkspaceStyles = {
  root: "snap-start scroll-mt-2 border-b border-border bg-map p-3 lg:p-5",
  workspace:
    "relative mx-auto flex h-[min(48vh,460px)] min-h-[320px] w-full max-w-6xl overflow-hidden rounded-xl border border-border bg-map shadow-sm",
  workspaceWithSidePanel:
    "h-auto min-h-0 flex-col lg:grid lg:h-[min(48vh,460px)] lg:min-h-[320px] lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:flex-row",
  mapPane: "relative flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden lg:min-h-0",
  sidePanel:
    "max-h-64 overflow-y-auto border-t border-border bg-surface lg:max-h-none lg:border-l lg:border-t-0",
  overlay:
    "absolute bottom-3 left-3 z-[500] max-w-sm rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-sm",
  title: "text-sm font-semibold text-fg",
  description: cn(textStyles.muted, "mt-1 text-xs leading-relaxed"),
  action: "mt-3",
} as const;
