import { useLayoutEffect, useMemo, useRef } from "react";
import { appStyles } from "../../App.styles";
import { PassIncludeControl } from "../segments/PassIncludeControl";
import { StretchPanel } from "../segments/StretchPanel";
import { useSegmentPassSelectionContext } from "./SegmentPassSelectionContext";
import type { SegmentDetailActions, SegmentDetailStretchState } from "./segmentDetailTypes";
import type { SegmentCompare } from "../../types";

type SegmentDetailBodyProps = {
  comparison: SegmentCompare | null;
  stretch: Omit<
    SegmentDetailStretchState,
    "fullPassMetrics" | "stretchPassMetrics"
  >;
  actions: Omit<
    SegmentDetailActions,
    "onSetPassIncluded" | "onApplyPassSelection" | "onExcludeIncludedPass"
  >;
};

export const SegmentDetailBody = ({ comparison, stretch, actions }: SegmentDetailBodyProps) => {
  const {
    includedPassIdSet,
    fullPassMetrics,
    stretchPassMetrics,
    setPassIncluded,
    excludePass,
    applyPassSelection,
  } = useSegmentPassSelectionContext();
  const matchedPasses = useMemo(
    () => (comparison?.passes ?? []).filter((pass) => pass.matched),
    [comparison],
  );
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
      <PassIncludeControl
        matchedPasses={matchedPasses}
        includedPassIdSet={includedPassIdSet}
        onSetPassIncluded={setPassIncluded}
        onApplySelection={applyPassSelection}
      />
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
        onSetStretchSource={actions.onSetStretchSourceActivity}
        includedPassCount={includedPassIdSet.size}
        onPreviewThresholds={actions.onPreviewStretchThresholds}
        onResetStretchPreview={actions.onResetStretchPreview}
        onSaveStretches={actions.onSaveStretches}
        defaultThresholds={stretch.defaultThresholds}
        loading={stretch.loading}
      />
    </div>
  );
};
