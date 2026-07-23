import { cn } from "../../../lib/cn";

export type SwitchSize = "default" | "sm";

const trackSize = {
  default: "h-6 w-11",
  sm: "h-5 w-9",
} as const;

const thumbTranslate = {
  default: "aria-checked:[&>span]:translate-x-5",
  sm: "aria-checked:[&>span]:translate-x-4",
} as const;

const thumbSize = {
  default: "size-5",
  sm: "size-4",
} as const;

export const switchStyles = {
  root: "inline-flex items-center gap-2 select-none",
  switch: (size: SwitchSize = "default") =>
    cn(
      "relative shrink-0 cursor-pointer rounded-full border-none bg-border-strong p-0 transition-colors",
      "focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-checked:bg-primary",
      thumbTranslate[size],
      trackSize[size],
    ),
  thumb: (size: SwitchSize = "default") =>
    cn(
      "absolute top-0.5 left-0.5 rounded-full bg-fg shadow-sm transition-transform",
      thumbSize[size],
    ),
  label: "min-w-0 cursor-pointer leading-snug",
} as const;