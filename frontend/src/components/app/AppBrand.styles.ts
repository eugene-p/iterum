import { cn } from "../../lib/cn";

export const appBrandStyles = {
  root: (compact = false) =>
    cn(
      "flex flex-col items-center gap-1.5 text-center",
      compact && "flex-row items-baseline justify-between gap-2 border-t border-border pt-3 text-left",
    ),
  name: (compact = false) =>
    cn("m-0 text-3xl font-semibold tracking-tight text-fg", compact && "text-sm"),
  tagline: (compact = false) =>
    cn("m-0 text-sm tracking-wide text-muted", compact && "text-[0.68rem] tracking-normal"),
} as const;
