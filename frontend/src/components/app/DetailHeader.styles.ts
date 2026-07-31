import { cn } from "../../lib/cn";
import { textStyles } from "../ui/Text/Text.styles";

export const detailHeaderStyles = {
  root: "flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-drop-surface px-3 py-2",
  info: "flex min-w-0 flex-1 flex-wrap items-center gap-3",
  title: "m-0 min-w-0 truncate text-sm font-semibold leading-tight text-fg",
  metadata: "inline-flex min-w-0 flex-wrap items-center gap-2",
  actions: "ml-auto flex flex-wrap items-center gap-2",
  typeBadge: "shrink-0",
  subtle: cn(textStyles.muted, "text-xs"),
} as const;
