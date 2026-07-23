import { useState, type ReactNode } from "react";
import { CollapsibleSection, MutedSpan } from "../../ui";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

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
      className={routeExplorerStyles.section}
      bodyClassName={routeExplorerStyles.hrChartSectionBody}
      title="Heart rate & elevation"
      headingLevel="h3"
      expanded={expanded}
      onToggle={() => setExpanded((open) => !open)}
      meta={
        passCount != null && passCount > 0 ? (
          <MutedSpan className={routeExplorerStyles.sectionToggleMeta}>
            {passCount} {passCount === 1 ? "pass" : "passes"}
          </MutedSpan>
        ) : undefined
      }
    >
      {children}
    </CollapsibleSection>
  );
};