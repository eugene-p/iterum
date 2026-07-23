import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
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
      <button
        type="button"
        className={modalStyles.closeBtn}
        onClick={onClose}
        aria-label={closeLabel}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={modalStyles.closeIcon}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <path d="M2 2l8 8M10 2 2 10" />
        </svg>
      </button>
    )}
  </div>
);