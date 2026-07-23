import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { inputStyles } from "./Input.styles";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputStyles.root, className)} {...props} />
));

Input.displayName = "Input";