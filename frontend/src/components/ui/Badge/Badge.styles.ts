import { cn } from "../../../lib/cn";

export const badgeStyles = {
  root: (variant?: "ok" | "warn") =>
    cn(
      "inline-block rounded-full bg-elevated-hover px-[0.45rem] py-[0.1rem] text-xs text-subtle",
      variant === "ok" && "bg-success-muted text-success",
      variant === "warn" && "bg-warn-surface text-warn",
    ),
} as const;