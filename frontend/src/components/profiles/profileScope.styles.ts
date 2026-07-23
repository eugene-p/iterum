import { cn } from "../../lib/cn";
import { textStyles } from "../ui/Text/Text.styles";

export const profileScopeStyles = {
  hint: cn(textStyles.muted, "px-2 text-[0.68rem] leading-none"),
  dateProfileRow: "mt-[0.1rem] flex min-w-0 items-baseline justify-between gap-2",
  dateProfileOwner: cn(
    textStyles.muted,
    "max-w-[45%] shrink-0 truncate text-right text-[0.68rem] leading-[1.2]",
  ),
} as const;