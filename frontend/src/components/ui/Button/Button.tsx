import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { buttonStyles } from "./Button.styles";

export type ButtonVariant = "default" | "primary" | "danger";
export type ButtonSize = "default" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantMap = {
  default: undefined,
  primary: "primary",
  danger: "danger",
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "default", size = "default", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonStyles.base(variantMap[variant]), size === "sm" && buttonStyles.sm, className)}
      {...props}
    />
  );
});