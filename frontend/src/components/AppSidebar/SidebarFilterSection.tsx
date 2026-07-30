import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { CollapsibleSection } from "../ui";

type SidebarFilterSectionProps = {
  countLabel: string;
  summary: string;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Presentation-only compact disclosure shared by sidebar list filters. */
export const SidebarFilterSection = ({
  countLabel,
  summary,
  active,
  expanded,
  onToggle,
  children,
  className,
  bodyClassName,
}: SidebarFilterSectionProps) => (
  <CollapsibleSection
    className={cn("shrink-0", className)}
    headerClassName="gap-1 px-1 py-1"
    titleClassName="min-w-0 flex-1 font-normal text-inherit"
    bodyClassName={cn("flex flex-col gap-1.5 px-1 pb-1.5 pt-0", bodyClassName)}
    headingLevel="h3"
    expanded={expanded}
    onToggle={onToggle}
    title={
      <span className="flex min-w-0 items-center gap-1.5 text-[0.78rem] leading-none">
        <span className={cn("shrink-0 font-semibold text-subtle", active && "text-fg")}>
          {countLabel}
        </span>
        <span className="shrink-0 text-muted opacity-50" aria-hidden="true">
          |
        </span>
        <span className={cn("min-w-0 font-medium text-muted", active && "text-subtle")} title={summary}>
          {summary}
        </span>
      </span>
    }
  >
    {children}
  </CollapsibleSection>
);
