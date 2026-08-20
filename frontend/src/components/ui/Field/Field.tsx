import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { fieldStyles } from "./Field.styles";

export type FieldProps = Omit<LabelHTMLAttributes<HTMLLabelElement>, "children"> & {
  label: ReactNode;
  description?: ReactNode;
  labelClassName?: string;
  descriptionClassName?: string;
  children: ReactNode;
};

/** Layout-only label/control pair. Validation and value handling stay with the caller. */
export const Field = ({
  label,
  description,
  labelClassName,
  descriptionClassName,
  className,
  children,
  ...props
}: FieldProps) => (
  <label className={cn(fieldStyles.root, className)} {...props}>
    <span className={cn(fieldStyles.label, labelClassName)}>{label}</span>
    {children}
    {description != null && (
      <span className={cn(fieldStyles.description, descriptionClassName)}>{description}</span>
    )}
  </label>
);
