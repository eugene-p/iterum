import { cn } from "../../../lib/cn";
import { textStyles } from "../../ui/Text/Text.styles";

export const activitiesPanelStyles = {
  root: "flex min-h-0 w-full flex-1 flex-col",
  body: "min-h-0 flex-1 overflow-y-auto py-3",
  footer: "w-full shrink-0",
  itemName:
    "mt-[0.15rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-semibold leading-[1.2]",
  itemMeta: cn(
    textStyles.muted,
    "mt-[0.1rem] overflow-hidden text-ellipsis whitespace-nowrap text-[0.68rem] leading-[1.2]",
  ),
} as const;