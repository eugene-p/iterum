import { useLayoutEffect, useMemo, useRef } from "react";
import type { Segment } from "../../types";
import { Button } from "../ui";
import { RouteWorkspace } from "../maps/RouteWorkspace";
import { PassIncludeControl } from "../segments/PassIncludeControl";
import { StretchPanel } from "../segments/StretchPanel";
import { StretchSelectionList } from "../segments/StretchSelectionList";
import { SegmentPerformanceBaseline } from "../segments/SegmentPerformanceBaseline/SegmentPerformanceBaseline";
import { useSegmentPassSelectionContext } from "./SegmentPassSelectionContext";
import { SegmentDetailMap } from "./SegmentDetailMap";
import { SegmentOverview } from "./SegmentOverview";
import { segmentDetailBodyStyles as styles } from "./SegmentDetailBody.styles";
import type {
  SegmentDetailActions,
  SegmentDetailMapState,
  SegmentDetailStretchState,
} from "./segmentDetailTypes";
import type { SegmentBaselines, SegmentCompare, SegmentPass, Stretch } from "../../types";

type SegmentDetailBodyProps = {
  segment: Segment;
  comparison: SegmentCompare | null;
  map: SegmentDetailMapState;
  onComparePasses: () => void;
  onEditStretches: () => void;
  stretch: Pick<
    SegmentDetailStretchState,
    | "selectedStretch"
    | "selectedPassStretchMetrics"
    | "stretchState"
    | "selectedStretchIndex"
    | "stretchSourcePassId"
    | "loading"
  >;
  actions: Pick<SegmentDetailActions, "onSelectStretch" | "onClearStretchSelection">;
  displayStretches?: Stretch[];
  baselines?: SegmentBaselines | null;
  baselineAggregationType?: string;
  onBaselineAggregationTypeChange?: (type: string) => void;
  focalActivityId?: number | null;
  focalPassNumber?: number | null;
  onFocusPass?: (pass: SegmentPass) => void;
};

export const SegmentDetailBody = ({
  segment,
  comparison,
  map,
  onComparePasses,
  onEditStretches,
  stretch,
  actions,
  displayStretches,
  baselines = null,
  baselineAggregationType = "rolling_90d",
  onBaselineAggregationTypeChange,
  focalActivityId,
  focalPassNumber,
  onFocusPass,
}: SegmentDetailBodyProps) => {
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

  const stretches = displayStretches ?? comparison?.stretches ?? [];

  return (
    <div
      ref={bodyRef}
      className={styles.root}
      onScroll={() => {
        scrollTopRef.current = bodyRef.current?.scrollTop ?? 0;
      }}
    >
      <RouteWorkspace
        title="Route workspace"
        description="Select a stretch to compare that meaningful part of the segment across included passes."
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={onComparePasses}
            disabled={!comparison?.reference_points.length}
          >
            Compare passes
          </Button>
        }
        sidePanel={
          <StretchSelectionList
            stretches={stretches}
            selectedStretchIndex={stretch.selectedStretchIndex}
            onSelectStretch={actions.onSelectStretch}
            onClearSelection={actions.onClearStretchSelection}
            actions={
              <Button
                size="sm"
                onClick={onEditStretches}
                disabled={!comparison?.stretches?.length || !comparison?.reference_points.length}
              >
                Edit
              </Button>
            }
          />
        }
      >
        <SegmentDetailMap
          routes={map.routes}
          segment={segment}
          segmentHighlightPoints={map.segmentHighlightPoints}
          stretchOverlays={map.stretchOverlays}
        />
      </RouteWorkspace>
      <main className={styles.content}>
        <SegmentOverview
          segment={segment}
          matchedPasses={matchedPasses}
          stretchCount={stretches.length}
          selectedStretch={stretch.selectedStretch}
          selectedStretchMetrics={stretchPassMetrics}
        />
        {baselines && onBaselineAggregationTypeChange ? (
          <SegmentPerformanceBaseline
            data={baselines}
            aggregationType={baselineAggregationType}
            onAggregationTypeChange={onBaselineAggregationTypeChange}
          />
        ) : null}
        <StretchPanel
          stretches={stretches}
          fullPassMetrics={fullPassMetrics}
          reason={comparison?.stretch_reason}
          stretchState={stretch.stretchState}
          selectedStretchIndex={stretch.selectedStretchIndex}
          selectedStretch={stretch.selectedStretch}
          stretchPassMetrics={stretchPassMetrics}
          stretchSourcePassId={stretch.stretchSourcePassId}
          onSelectStretch={actions.onSelectStretch}
          onClearStretchSelection={actions.onClearStretchSelection}
          onExcludeIncludedPass={excludePass}
          includedPassCount={includedPassIdSet.size}
          loading={stretch.loading}
          selectionMode="map"
        />
        <PassIncludeControl
          matchedPasses={matchedPasses}
          includedPassIdSet={includedPassIdSet}
          onSetPassIncluded={setPassIncluded}
          onApplySelection={applyPassSelection}
          focalActivityId={focalActivityId}
          focalPassNumber={focalPassNumber}
          onFocusPass={onFocusPass}
        />
      </main>
    </div>
  );
};
