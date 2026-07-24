import { cn } from "../../../lib/cn";
import { inputStyles } from "../../ui/Input/Input.styles";
import { textStyles } from "../../ui/Text/Text.styles";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";

export const segmentsPanelStyles = {
  filters: "shrink-0",
  filtersHeader: "gap-1 px-1 py-1",
  // Reset heading defaults so the composite title controls weight/color.
  filtersTitle: "min-w-0 flex-1 font-normal text-inherit",
  filtersTitleRow: "flex min-w-0 items-center gap-1.5 text-[0.78rem] leading-none",
  filtersCount: (active: boolean) =>
    cn("shrink-0 font-semibold text-subtle", active && "text-fg"),
  filtersSep: "shrink-0 text-muted opacity-50",
  filtersSort: (active: boolean) =>
    cn("min-w-0 font-medium text-muted", active && "text-subtle"),
  filtersBody: "flex flex-col gap-1.5 px-1 pb-1.5 pt-0",
  sortRow: "flex items-center gap-[0.45rem]",
  sortLabel: cn(textStyles.muted, "shrink-0 text-xs"),
  sortSelect: cn(
    inputStyles.root,
    "w-auto min-w-0 flex-1 cursor-pointer px-2 py-[0.3rem] text-[0.75rem]",
  ),
  listItem: (active: boolean, hero: boolean) =>
    cn(
      sidebarListStyles.listItem(active),
      hero && "bg-drop-surface py-2.5",
    ),
  itemName: (hero: boolean) =>
    cn(
      sidebarListStyles.itemName,
      hero && "text-[0.92rem] font-bold leading-[1.25]",
    ),
  matchMeta: (hero: boolean) =>
    cn(
      textStyles.muted,
      "mt-[0.15rem] text-[0.72rem] leading-[1.3]",
      hero ? "font-semibold text-subtle" : "font-medium",
    ),
  contextMeta: cn(
    textStyles.muted,
    "mt-[0.1rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.65rem] leading-[1.2] opacity-80",
  ),
} as const;
