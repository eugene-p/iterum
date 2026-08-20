import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
import { CloseButton } from "../CloseButton";
import { modalStyles } from "./Modal.styles";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  backdropClassName?: string;
  panelClassName?: string;
};

export const Modal = ({
  open,
  onClose,
  children,
  backdropClassName,
  panelClassName,
}: ModalProps) => {
  if (!open) return null;

  return createPortal(
    <div className={cn(modalStyles.backdrop, backdropClassName)} onClick={onClose}>
      <div
        className={cn(modalStyles.panel, panelClassName)}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

type ModalHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
};

export const ModalHeader = ({
  title,
  subtitle,
  actions,
  onClose,
  closeLabel = "Close",
  className,
  children,
  ...props
}: ModalHeaderProps) => (
  <div className={cn(modalStyles.header, className)} {...props}>
    <div className={modalStyles.headerLead}>
      {title != null && <h2 className={modalStyles.title}>{title}</h2>}
      {subtitle}
      {children}
    </div>
    {actions}
    {onClose && (
      <CloseButton onClick={onClose} aria-label={closeLabel} />
    )}
  </div>
);
