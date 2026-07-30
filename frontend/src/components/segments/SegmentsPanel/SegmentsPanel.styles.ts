import { cn } from "../../../lib/cn";
import { inputStyles } from "../../ui/Input/Input.styles";
import { textStyles } from "../../ui/Text/Text.styles";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";

export const segmentsPanelStyles = {
  sortRow: "flex items-center gap-[0.45rem]",
  sortLabel: cn(textStyles.muted, "shrink-0 text-xs"),
  sortSelect: cn(
    inputStyles.root,
    "w-auto min-w-0 flex-1 cursor-pointer px-2 py-[0.3rem] text-[0.75rem]",
  ),
  listItem: (hero: boolean) =>
    cn(
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
