import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { iconButtonStyles } from "./IconButton.styles";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const IconButton = ({ className, type = "button", ...props }: IconButtonProps) => (
  <button type={type} className={cn(iconButtonStyles.root, className)} {...props} />
);