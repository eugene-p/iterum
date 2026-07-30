import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type DetailActionsProps = {
  children: ReactNode;
  className?: string;
};

/** Keeps detail actions compact while allowing each screen to supply its own controls. */
export const DetailActions = ({ children, className }: DetailActionsProps) => (
  <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>
);
