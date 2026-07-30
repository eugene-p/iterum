import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  header?: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

/** Shared compact surface with optional header, body, and footer sections. */
export const Card = ({
  className,
  children,
  header,
  footer,
  headerClassName,
  bodyClassName,
  footerClassName,
  ...props
}: CardProps) => (
  <section
    className={cn("w-full rounded-md border border-border bg-drop-surface p-4", className)}
    {...props}
  >
    {header && <header className={headerClassName}>{header}</header>}
    {children && <div className={bodyClassName}>{children}</div>}
    {footer && <footer className={footerClassName}>{footer}</footer>}
  </section>
);
