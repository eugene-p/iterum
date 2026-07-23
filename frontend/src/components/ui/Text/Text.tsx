import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn";
import { textStyles } from "./Text.styles";

type TextProps = HTMLAttributes<HTMLParagraphElement>;
type SpanTextProps = HTMLAttributes<HTMLSpanElement>;

export const MutedText = ({ className, ...props }: TextProps) => (
  <p className={cn(textStyles.muted, className)} {...props} />
);

export const MutedSpan = ({ className, ...props }: SpanTextProps) => (
  <span className={cn(textStyles.muted, className)} {...props} />
);

export const ErrorText = ({ className, ...props }: TextProps) => (
  <p className={cn(textStyles.error, className)} {...props} />
);