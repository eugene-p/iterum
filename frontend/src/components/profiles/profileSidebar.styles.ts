import { cn } from "../../lib/cn";
import { textStyles } from "../ui/Text/Text.styles";

export const profileSidebarStyles = {
  root: "min-h-0 flex-1 overflow-y-auto",
  statusRow: "border-b border-border px-2 py-1.5",
  scopeCheck: cn(
    textStyles.muted,
    "mt-1.5 flex w-full cursor-pointer items-center justify-between gap-2 text-[0.78rem] leading-snug",
  ),
} as const;