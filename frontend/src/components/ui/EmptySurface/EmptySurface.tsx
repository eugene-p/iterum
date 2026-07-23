import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { emptySurfaceStyles } from "./EmptySurface.styles";

type EmptySurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export const EmptySurface = ({ className, children, ...props }: EmptySurfaceProps) => (
  <div className={cn(emptySurfaceStyles.root, className)} {...props}>
    {children}
  </div>
);