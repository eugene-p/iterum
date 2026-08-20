import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { selectStyles } from "./Select.styles";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(selectStyles.root, className)} {...props} />
  ),
);

Select.displayName = "Select";
