import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { panelStyles } from "./Panel.styles";

type PanelProps = HTMLAttributes<HTMLElement> & {
  flush?: boolean;
};

export const Panel = ({ flush = false, className, ...props }: PanelProps) => (
  <section className={cn(panelStyles.root, flush && panelStyles.flush, className)} {...props} />
);