import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { popoverStyles } from "./Popover.styles";

type PopoverProps = {
  title?: string;
  ariaLabel: string;
  placement: { top: number; left: number; width: number };
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export const Popover = ({
  title,
  ariaLabel,
  placement,
  children,
  className,
  bodyClassName,
}: PopoverProps) => {
  const style: CSSProperties = {
    top: placement.top,
    left: placement.left,
    width: placement.width,
  };

  return createPortal(
    <div
      className={cn(popoverStyles.root, className)}
      style={style}
      role="tooltip"
      aria-label={ariaLabel}
    >
      {title && <div className={popoverStyles.title}>{title}</div>}
      <div className={cn(popoverStyles.body, bodyClassName)}>{children}</div>
    </div>,
    document.body,
  );
};