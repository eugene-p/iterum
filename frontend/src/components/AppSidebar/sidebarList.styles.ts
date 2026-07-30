import { cn } from "../../lib/cn";
import { inputStyles } from "../ui/Input/Input.styles";
import { textStyles } from "../ui/Text/Text.styles";

export const sidebarListStyles = {
  toolbar: "flex items-center gap-1.5",
  search: cn(inputStyles.root, "min-w-0 flex-1 px-2 py-1 text-[0.82rem]"),
  listCount: cn(textStyles.muted, "shrink-0 text-xs"),
  list: "m-0 flex list-none flex-col gap-0 p-0",
  listEmpty: cn(textStyles.muted, "border-b border-border px-2 py-3 text-[0.82rem]"),
  itemButton:
    "block min-h-9 w-full border-b border-border px-2 py-1.5 text-left transition-colors hover:bg-card-active",
  selectedItem: "bg-card-active shadow-[inset_3px_0_0_theme(--color-primary)]",
  itemName:
    "overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-semibold leading-[1.2]",
  itemMeta: cn(
    textStyles.muted,
    "mt-[0.1rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.68rem] leading-[1.2]",
  ),
} as const;
