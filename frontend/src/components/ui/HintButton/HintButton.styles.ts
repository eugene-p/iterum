import { cn } from "../../../lib/cn";

export const hintButtonStyles = {
  wrap: "relative inline-flex",
  button: (size: "default" | "lg" = "default") =>
    cn(
      "inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-elevated font-bold leading-none text-muted hover:bg-elevated-hover hover:text-fg",
      size === "lg" ? "size-7 text-sm" : "size-[1.1rem] text-[0.62rem]",
    ),
  popover: ({
    size = "default",
    placement = "bottom",
  }: {
    size?: "default" | "lg";
    placement?: "top" | "bottom";
  } = {}) =>
    cn(
      "absolute left-1/2 z-[30] -translate-x-1/2 rounded-lg border border-border bg-card text-muted shadow-[0_8px_20px_rgba(0,0,0,0.35)]",
      size === "lg" ? "w-72 px-3 py-2 text-sm leading-snug" : "w-52 px-2 py-1.5 text-[0.75rem] leading-snug",
      placement === "top" ? "bottom-[calc(100%+0.35rem)]" : "top-[calc(100%+0.35rem)]",
    ),
} as const;