import { useState } from "react";
import { cn } from "../../../lib/cn";
import { hintButtonStyles } from "./HintButton.styles";

type HintButtonProps = {
  text: string;
  size?: "default" | "lg";
  placement?: "top" | "bottom";
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
};

export const HintButton = ({
  text,
  size = "default",
  placement = "bottom",
  className,
  buttonClassName,
  popoverClassName,
}: HintButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <span className={cn(hintButtonStyles.wrap, className)}>
      <button
        type="button"
        className={cn(hintButtonStyles.button(size), buttonClassName)}
        aria-label="How to use this control"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
      >
        ?
      </button>
      {open && (
        <span
          className={cn(hintButtonStyles.popover({ size, placement }), popoverClassName)}
          role="tooltip"
        >
          {text}
        </span>
      )}
    </span>
  );
};