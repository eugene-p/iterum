import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { collapsibleSectionStyles } from "./CollapsibleSection.styles";

type CollapsibleSectionProps = {
  title: ReactNode;
  meta?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headingLevel?: "h2" | "h3";
};

export const CollapsibleSection = ({
  title,
  meta,
  expanded,
  onToggle,
  children,
  className,
  bodyClassName,
  headingLevel: Heading = "h2",
}: CollapsibleSectionProps) => (
  <section className={className}>
    <div className={collapsibleSectionStyles.header}>
      <button
        type="button"
        className={collapsibleSectionStyles.titleButton}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <Heading className={collapsibleSectionStyles.title}>{title}</Heading>
      </button>
      {meta != null && <div className={collapsibleSectionStyles.meta}>{meta}</div>}
      <button
        type="button"
        className={collapsibleSectionStyles.chevronButton}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse section" : "Expand section"}
        onClick={onToggle}
      >
        <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
      </button>
    </div>
    {expanded && (
      <div className={cn(collapsibleSectionStyles.body, bodyClassName)}>{children}</div>
    )}
  </section>
);