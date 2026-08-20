import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
import { CloseButton } from "../CloseButton";
import { drawerStyles } from "./Drawer.styles";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  backdropClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  size?: "default" | "wide" | "map";
  closeLabel?: string;
};

export const Drawer = ({
  open,
  onClose,
  title,
  children,
  footer,
  backdropClassName,
  panelClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  size = "default",
  closeLabel = "Close",
}: DrawerProps) => {
  if (!open) return null;

  return createPortal(
    <div className={cn(drawerStyles.backdrop, backdropClassName)} onClick={onClose}>
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
        <div className={cn(drawerStyles.header, headerClassName)}>
          <h2 className={drawerStyles.title}>{title}</h2>
          <CloseButton onClick={onClose} aria-label={closeLabel} />
        </div>
        <div className={cn(drawerStyles.body, bodyClassName)}>{children}</div>
        {footer != null && <div className={cn(drawerStyles.footer, footerClassName)}>{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
};
