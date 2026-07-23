import { cn } from "../../../lib/cn";

export const activityDateTimeStyles = {
  root: (extra?: string) =>
    cn(
      "inline-flex items-baseline gap-[0.3rem] text-[0.72rem] whitespace-nowrap tabular-nums",
      extra,
    ),
  date: "font-semibold text-accent",
  sep: "text-[#5a6d85]",
  time: "text-subtle",
  inlineBlock: "mt-[0.1rem] block",
} as const;