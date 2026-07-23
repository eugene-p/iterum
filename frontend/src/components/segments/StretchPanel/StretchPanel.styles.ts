import { cn } from "../../../lib/cn";
import { inputStyles } from "../../ui/Input/Input.styles";
import { panelStyles } from "../../ui/Panel/Panel.styles";
import { stackStyles } from "../../ui/Stack/Stack.styles";
import { textStyles } from "../../ui/Text/Text.styles";

export const stretchPanelStyles = {
  panel: cn(panelStyles.root, stackStyles.stack, "gap-0 p-0 overflow-hidden"),
  body: cn(stackStyles.stack, "gap-2 px-[0.85rem] pb-[0.85rem]"),
  hint: "m-0 text-[0.75rem]",
  toggleMeta: "text-[0.78rem]",
  splitLayout: "grid min-h-0 gap-3 lg:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)] lg:items-start",
  stretchListPane: "min-w-0",
  comparisonPane: cn(stackStyles.stack, "min-w-0 gap-1.5"),
  comparisonHeader: "flex flex-wrap items-center gap-2",
  comparisonTitle: "m-0 text-[0.82rem] font-semibold text-subtle",
  stretchTable: "w-full border-collapse text-[0.75rem]",
  stretchTh: "border-b border-border px-1.5 py-0.5 text-left font-medium text-muted",
  stretchTd: "border-b border-border/60 px-1.5 py-0.5 align-middle whitespace-nowrap",
  stretchRow: (selected: boolean) =>
    cn("cursor-pointer transition-colors hover:bg-accent/5", selected && "bg-accent/10"),
  fullSegmentRow: (selected: boolean) =>
    cn(
      "cursor-pointer font-medium text-subtle transition-colors hover:bg-accent/5",
      selected && "bg-accent/10",
    ),
  kindBadge: (kind: "climb" | "flat" | "descent") =>
    cn(
      "inline-flex rounded px-1 py-px text-[0.68rem] font-medium leading-tight",
      kind === "climb" && "bg-[#ff8f6b22] text-[#ffb199]",
      kind === "flat" && "bg-[#5eead422] text-[#7ee8d8]",
      kind === "descent" && "bg-[#c084fc22] text-[#d8b4fe]",
    ),
  comparisonTable: "w-full border-collapse text-[0.78rem]",
  comparisonTh:
    "border-b border-border px-1.5 py-1 text-left font-medium text-muted whitespace-nowrap",
  comparisonTd: "border-b border-border/60 px-1.5 py-1 align-top",
  comparisonRow: (selected: boolean) =>
    cn(selected && "bg-accent/10"),
  comparisonActivityName: "text-[0.78rem] font-medium leading-tight",
  excludeButton:
    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-0 bg-transparent p-0 text-[1rem] leading-none text-muted transition-colors hover:bg-danger/15 hover:text-danger",
  settingsGrid: "grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3",
  settingsSections: "flex flex-col gap-3",
  settingsSection: "flex flex-col gap-2",
  settingsSectionTitle: "text-[0.78rem] font-medium text-subtle",
  settingsSectionGrid3: "grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-3",
  settingsSectionGrid2: "grid grid-cols-2 gap-x-3 gap-y-2",
  settingLabel: cn(textStyles.muted, "flex flex-col gap-0.5 text-[0.78rem]"),
  settingLabelRow: "flex items-center gap-1",
  settingInput: cn(inputStyles.root, "w-full text-[0.82rem]"),
  actions: "flex flex-wrap items-center gap-2",
  actionsFooter:
    "mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3",
};