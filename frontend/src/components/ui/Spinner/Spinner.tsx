import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { spinnerStyles } from "./Spinner.styles";

type SpinnerProps = HTMLAttributes<HTMLSpanElement>;

export const Spinner = ({ className, ...props }: SpinnerProps) => (
  <span className={cn(spinnerStyles.root, className)} aria-hidden="true" {...props} />
);