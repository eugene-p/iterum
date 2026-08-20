import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { closeButtonStyles } from "./CloseButton.styles";

export type CloseButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Shared close affordance for overlays. It owns presentation, not overlay state. */
export const CloseButton = ({ className, type = "button", "aria-label": ariaLabel, ...props }: CloseButtonProps) => (
  <button
    type={type}
    className={cn(closeButtonStyles.root, className)}
    aria-label={ariaLabel ?? "Close"}
    {...props}
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={closeButtonStyles.icon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M2 2l8 8M10 2 2 10" />
    </svg>
  </button>
);
