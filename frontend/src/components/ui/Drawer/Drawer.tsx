import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
import { drawerStyles } from "./Drawer.styles";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
  size?: "default" | "wide" | "map";
  closeLabel?: string;
};

export const Drawer = ({
  open,
  onClose,
  title,
  children,
  footer,
  panelClassName,
  bodyClassName,
  size = "default",
  closeLabel = "Close",
}: DrawerProps) => {
  if (!open) return null;

  return createPortal(
    <div className={drawerStyles.backdrop} onClick={onClose}>
      <aside
        className={cn(
          size === "map"
            ? drawerStyles.panelMap
            : size === "wide"
              ? drawerStyles.panelWide
              : drawerStyles.panel,
          panelClassName,
        )}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div className={drawerStyles.header}>
          <h2 className={drawerStyles.title}>{title}</h2>
          <button
            type="button"
            className={drawerStyles.closeBtn}
            onClick={onClose}
            aria-label={closeLabel}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              className={drawerStyles.closeIcon}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            >
              <path d="M2 2l8 8M10 2 2 10" />
            </svg>
          </button>
        </div>
        <div className={cn(drawerStyles.body, bodyClassName)}>{children}</div>
        {footer != null && <div className={drawerStyles.footer}>{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
};