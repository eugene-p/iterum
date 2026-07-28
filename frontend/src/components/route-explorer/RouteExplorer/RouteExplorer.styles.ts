import { cn } from "../../../lib/cn";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";
import { modalStyles } from "../../ui/Modal/Modal.styles";

export const routeExplorerStyles = {
  panel: cn(modalStyles.panel, "max-w-[1280px]"),
  /** Full main-area shell when compare is a workspace (not a modal). */
  workspace: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface",
  workspaceHeader:
    "flex h-9 shrink-0 items-center gap-3 border-b border-border px-3",
  /** Plain text link: no chrome, underline only on hover. */
  workspaceBack:
    "shrink-0 appearance-none border-0 bg-transparent p-0 text-[0.78rem] font-normal leading-none text-muted shadow-none ring-0 outline-none hover:text-fg hover:underline hover:underline-offset-2 focus-visible:underline focus-visible:underline-offset-2 focus-visible:outline-none",
  workspaceHeaderLead: "flex min-w-0 flex-1 items-center gap-x-1.5 overflow-hidden",
  workspaceTitle: "m-0 shrink-0 text-[0.82rem] font-semibold leading-none text-fg",
  workspaceBody: "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-3 py-3",
  workspaceTabBar: "ml-auto flex shrink-0 items-center gap-0 border-b-0",
  headerWithTabs: "border-b-0 pb-0",
  tabBar: "-mx-3 px-3",
  toolbarSep: "shrink-0 text-[0.82rem] text-muted",
  toolbarSubtitle: "min-w-0 truncate text-[0.78rem] text-muted",
  toolbarDateTime: "shrink-0 text-[0.75rem] text-muted",
  body: "flex-1",

  section: "rounded-[10px] border border-border bg-card p-[0.85rem]",
  sectionHead: "flex flex-wrap items-center justify-between gap-2",
  sectionHeadLead: "flex items-center gap-1.5",
  sectionTitle: "m-0 text-[0.9rem] font-semibold leading-none text-subtle",
  sectionControls: "flex flex-col gap-1.5 px-[0.85rem] py-[0.5rem]",
  sectionHint: "m-0 text-[0.78rem]",

  slider: "w-full accent-primary",

  mapStage:
    "grid min-h-[min(62vh,580px)] gap-3 [grid-template-columns:1fr_min(300px,32%)] max-[860px]:min-h-auto max-[860px]:[grid-template-columns:1fr]",
  mapWrap:
    "h-full min-h-[min(62vh,580px)] overflow-hidden rounded-[10px] border border-border max-[860px]:min-h-[360px]",
  legend:
    "flex min-h-0 flex-col overflow-y-auto border border-border bg-card max-[860px]:max-h-[220px]",
  legendTitle:
    "m-0 border-b border-border px-2 py-2 text-[0.72rem] tracking-wide text-muted uppercase",

  metricsGrid:
    "grid gap-0 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))] border-b border-border px-2 py-1.5",
  metric: "flex flex-col gap-[0.15rem] border-r border-border px-2 py-1 last:border-r-0",
  metricLabel: "text-[0.72rem] tracking-wide text-muted uppercase",
  metricValue: "text-[0.95rem] font-semibold",

  passRow: "flex items-start gap-2 border-b border-border px-2 py-1.5 last:border-b-0",
  passDot: "mt-[0.35rem] size-2.5 shrink-0 rounded-full",
  passMain: "min-w-0 flex-1",
  passTitleRow: "flex items-center justify-between gap-2",
  passTitle: sidebarListStyles.itemName,
  positionSwatch: "size-2.5 shrink-0 rounded-full",
  passMetrics: cn(sidebarListStyles.itemMeta, "mt-[0.15rem]"),
  passDateTime: sidebarListStyles.itemMeta,
  passSwitches: "flex flex-wrap gap-x-4 gap-y-[0.35rem]",
  passSwitch: "items-start text-sm",
  passSwitchLabel: "flex flex-col gap-[0.1rem] leading-[1.25]",
  passRowWithPosition: "border-l-[3px] pl-2",
  positionLegend:
    "flex flex-wrap gap-x-3 gap-y-1 border-b border-border px-2 py-1.5 text-[0.68rem] text-muted",
  positionLegendItem: "inline-flex items-center gap-1.5",
  positionLegendSwatch: "size-2 shrink-0 rounded-full",
} as const;