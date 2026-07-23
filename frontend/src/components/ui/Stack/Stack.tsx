import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { stackStyles } from "./Stack.styles";

type StackProps = HTMLAttributes<HTMLDivElement>;

export const Stack = ({ className, ...props }: StackProps) => (
  <div className={cn(stackStyles.stack, className)} {...props} />
);

export const Row = ({ className, ...props }: StackProps) => (
  <div className={cn(stackStyles.row, className)} {...props} />
);