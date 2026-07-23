import { useLayoutEffect, useRef, useState } from "react";
import { appStyles } from "../../App.styles";
import { ComparisonTable } from "../segments/ComparisonTable";
import { stretchPanelStyles } from "../segments/StretchPanel/StretchPanel.styles";
import { StretchPanel } from "../segments/StretchPanel";
import { CollapsibleSection, MutedSpan, MutedText } from "../ui";
import { useSegmentPassSelectionContext } from "./SegmentPassSelectionContext";
import type { SegmentDetailActions, SegmentDetailStretchState } from "./segmentDetailTypes";
import type { SegmentCompare } from "../../types";

type SegmentDetailBodyProps = {
  comparison: SegmentCompare | null;
  stretch: Omit<
    SegmentDetailStretchState,
    "fullPassMetrics" | "stretchPassMetrics"
  >;
  actions: Omit<SegmentDetailActions, "onSetPassIncluded" | "onExcludeIncludedPass">;
};

export const SegmentDetailBody = ({ comparison, stretch, actions }: SegmentDetailBodyProps) => {
  const {
    includedPassIdSet,
    fullPassMetrics,
    stretchPassMetrics,
    setPassIncluded,
    excludePass,
  } = useSegmentPassSelectionContext();
  const matchedPassCount = (comparison?.passes ?? []).filter((pass) => pass.matched).length;
  const [matchedPassesExpanded, setMatchedPassesExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTopRef = useRef(0);
  const includedPassKey = [...includedPassIdSet].join(",");

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = scrollTopRef.current;
  }, [includedPassKey]);

  return (
    <div
      ref={bodyRef}
      className={appStyles.segmentDetailBody}
      onScroll={() => {
        scrollTopRef.current = bodyRef.current?.scrollTop ?? 0;
      }}
    >
      <StretchPanel
        stretches={comparison?.stretches ?? []}
        fullPassMetrics={fullPassMetrics}
        thresholds={stretch.thresholds}
        reason={comparison?.stretch_reason}
        stretchState={stretch.stretchState}
        stretchCanSave={stretch.stretchCanSave}
        selectedStretchIndex={stretch.selectedStretchIndex}
        selectedStretch={stretch.selectedStretch}
        stretchPassMetrics={stretchPassMetrics}
        stretchSourcePassId={stretch.stretchSourcePassId}
        onSelectStretch={actions.onSelectStretch}
        onClearStretchSelection={actions.onClearStretchSelection}
        onExcludeIncludedPass={excludePass}
        includedPassCount={includedPassIdSet.size}
        onPreviewThresholds={actions.onPreviewStretchThresholds}
        onResetStretchPreview={actions.onResetStretchPreview}
        onSaveStretches={actions.onSaveStretches}
        defaultThresholds={stretch.defaultThresholds}
        loading={stretch.loading}
      />
      <CollapsibleSection
        className={stretchPanelStyles.panel}
        bodyClassName={stretchPanelStyles.body}
        title="Matched passes"
        headingLevel="h2"
        expanded={matchedPassesExpanded}
        onToggle={() => setMatchedPassesExpanded((open) => !open)}
        meta={
          <MutedSpan className={stretchPanelStyles.toggleMeta}>
            {includedPassIdSet.size} of {matchedPassCount} included
          </MutedSpan>
        }
      >
        <MutedText className={stretchPanelStyles.hint}>
          Uncheck passes to exclude them from comparisons and stretch stats. The highlighted row is
          the stretch-source activity shown on the map — change it with Use. Green = best time /
          speed / HR among included passes.
        </MutedText>
        <ComparisonTable
          passes={comparison?.passes ?? []}
          includedPassIdSet={includedPassIdSet}
          stretchSourceActivityId={stretch.stretchSourceActivityId}
          stretchSourcePassId={stretch.stretchSourcePassId}
          onSetPassIncluded={setPassIncluded}
          onSetStretchSource={(pass) => actions.onSetStretchSourceActivity(pass.activity_id)}
        />
      </CollapsibleSection>
    </div>
  );
};