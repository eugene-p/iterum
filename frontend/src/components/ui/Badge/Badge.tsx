import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { badgeStyles } from "./Badge.styles";

export type BadgeVariant = "default" | "ok" | "warn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantMap = {
  default: undefined,
  ok: "ok",
  warn: "warn",
} as const;

export const Badge = ({ variant = "default", className, ...props }: BadgeProps) => (
  <span className={cn(badgeStyles.root(variantMap[variant]), className)} {...props} />
);