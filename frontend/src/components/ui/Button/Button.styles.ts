import { cn } from "../../../lib/cn";

export const buttonStyles = {
  base: (variant?: "primary" | "danger") =>
    cn(
      "cursor-pointer rounded-lg border border-border-strong bg-elevated px-3 py-[0.45rem] text-fg transition-colors hover:bg-elevated-hover disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-elevated",
      variant === "primary" &&
        "border-primary bg-primary hover:bg-primary-hover disabled:hover:bg-primary",
      variant === "danger" && "border-danger-border bg-danger-surface",
    ),
  sm: "rounded-md px-[0.45rem] py-[0.2rem] text-xs",
} as const;