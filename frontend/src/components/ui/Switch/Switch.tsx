import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { switchStyles, type SwitchSize } from "./Switch.styles";

type SwitchChangeEvent = {
  target: { checked: boolean };
};

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "size" | "role" | "onChange"> & {
  size?: SwitchSize;
  label?: ReactNode;
  labelPosition?: "start" | "end";
  checked?: boolean;
  onChange?: (event: SwitchChangeEvent) => void;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    className,
    size = "default",
    label,
    labelPosition = "start",
    id,
    disabled,
    checked = false,
    onChange,
    onClick,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  const control = (
    <button
      ref={ref}
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cn(switchStyles.switch(size), disabled && "cursor-not-allowed opacity-50")}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || disabled) return;
        onChange?.({ target: { checked: !checked } });
      }}
      {...props}
    >
      <span className={switchStyles.thumb(size)} aria-hidden="true" />
    </button>
  );

  if (label == null) {
    return <span className={cn(switchStyles.root, className)}>{control}</span>;
  }

  return (
    <span
      className={cn(switchStyles.root, disabled && "cursor-not-allowed opacity-50", className)}
    >
      {labelPosition === "end" && (
        <label htmlFor={switchId} className={switchStyles.label}>
          {label}
        </label>
      )}
      {control}
      {labelPosition === "start" && (
        <label htmlFor={switchId} className={switchStyles.label}>
          {label}
        </label>
      )}
    </span>
  );
});

Switch.displayName = "Switch";