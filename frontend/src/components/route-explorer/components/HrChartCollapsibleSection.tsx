import { useState, type ReactNode } from "react";
import { CollapsibleSection } from "../../ui";

type HrChartCollapsibleSectionProps = {
  children: ReactNode;
  passCount?: number;
};

export const HrChartCollapsibleSection = ({
  children,
  passCount,
}: HrChartCollapsibleSectionProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <CollapsibleSection
      variant="card"
      title="Heart rate & elevation"
      headingLevel="h3"
      expanded={expanded}
      onToggle={() => setExpanded((open) => !open)}
      meta={
        passCount != null && passCount > 0
          ? `${passCount} ${passCount === 1 ? "pass" : "passes"}`
          : undefined
      }
    >
      {children}
    </CollapsibleSection>
  );
};
