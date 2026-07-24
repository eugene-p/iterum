import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { collapsibleSectionStyles } from "./CollapsibleSection.styles";

export type CollapsibleSectionVariant = keyof typeof collapsibleSectionStyles.variant;

type CollapsibleSectionProps = {
  title: ReactNode;
  meta?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  variant?: CollapsibleSectionVariant;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  headingLevel?: "h2" | "h3";
};

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={collapsibleSectionStyles.chevronIcon}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {expanded ? (
      <path d="M3.5 6.5 8 11l4.5-4.5" />
    ) : (
      <path d="M6.5 3.5 11 8l-4.5 4.5" />
    )}
  </svg>
);

export const CollapsibleSection = ({
  title,
  meta,
  expanded,
  onToggle,
  children,
  variant = "bare",
  className,
  headerClassName,
  titleClassName,
  bodyClassName,
  headingLevel: Heading = "h2",
}: CollapsibleSectionProps) => (
  <section className={cn(collapsibleSectionStyles.variant[variant], className)}>
    <div className={cn(collapsibleSectionStyles.header, headerClassName)}>
      <button
        type="button"
        className={collapsibleSectionStyles.titleButton}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <Heading className={cn(collapsibleSectionStyles.title, titleClassName)}>{title}</Heading>
      </button>
      {meta != null && <div className={collapsibleSectionStyles.meta}>{meta}</div>}
      <button
        type="button"
        className={collapsibleSectionStyles.chevronButton}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse section" : "Expand section"}
        onClick={onToggle}
      >
        <ChevronIcon expanded={expanded} />
      </button>
    </div>
    {expanded && (
      <div className={cn(collapsibleSectionStyles.body, bodyClassName)}>{children}</div>
    )}
  </section>
);
