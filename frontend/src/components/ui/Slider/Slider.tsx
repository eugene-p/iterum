import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { sliderStyles } from "./Slider.styles";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Slider = forwardRef<HTMLInputElement, SliderProps>(({ className, ...props }, ref) => (
  <input ref={ref} type="range" className={cn(sliderStyles.root, className)} {...props} />
));

Slider.displayName = "Slider";
