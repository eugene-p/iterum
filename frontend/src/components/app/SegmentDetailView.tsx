import { useMemo } from "react";
import { appStyles } from "../../App.styles";
import { Button } from "../ui";
import { RouteWorkspace } from "../maps/RouteWorkspace";
import { PassIncludeControl } from "../segments/PassIncludeControl";
import { StretchPanel } from "../segments/StretchPanel";
import { StretchSelectionList } from "../segments/StretchSelectionList";
import { SegmentDetailHeader } from "./SegmentDetailHeader";
import { SegmentDetailMap } from "./SegmentDetailMap";
import { segmentDetailBodyStyles as styles } from "./SegmentDetailBody.styles";
import { SegmentOverview } from "./SegmentOverview";
import type { SegmentDetailViewProps } from "./segmentDetailTypes";

/**
 * Standalone segment view retained for callers that provide selection state directly.
 * The routed screen uses SegmentDetailBody, which obtains the same state from context.
 */
export const SegmentDetailView = ({
  segment,
  comparison,
  selectedPass,
  includedPassIdSet,
  map,
  stretch,
  headerActions,
  actions,
}: SegmentDetailViewProps) => {
  const matchedPasses = useMemo(
    () => (comparison?.passes ?? []).filter((pass) => pass.matched),
    [comparison],
  );
  const stretches = comparison?.stretches ?? [];

  return (
    <>
      <title>Iterum: Segment</title>
      <div className={appStyles.detailScreen}>
        <SegmentDetailHeader
          segment={segment}
          comparison={comparison}
          selectedPass={selectedPass}
          selectedStretch={stretch.selectedStretch}
          selectedPassStretchMetrics={stretch.selectedPassStretchMetrics}
          headerActions={headerActions}
        />
        <div className={styles.root}>
          <RouteWorkspace
            title="Route workspace"
            description="Select a stretch to compare that meaningful part of the segment across included passes."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={headerActions.onComparePasses}
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
                    onClick={headerActions.onEditStretches}
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
              selectedStretchMetrics={stretch.stretchPassMetrics}
            />
            <StretchPanel
              stretches={stretches}
              fullPassMetrics={stretch.fullPassMetrics}
              reason={comparison?.stretch_reason}
              stretchState={stretch.stretchState}
              selectedStretchIndex={stretch.selectedStretchIndex}
              selectedStretch={stretch.selectedStretch}
              stretchPassMetrics={stretch.stretchPassMetrics}
              stretchSourcePassId={stretch.stretchSourcePassId}
              onSelectStretch={actions.onSelectStretch}
              onClearStretchSelection={actions.onClearStretchSelection}
              onExcludeIncludedPass={actions.onExcludeIncludedPass}
              includedPassCount={includedPassIdSet.size}
              loading={stretch.loading}
              selectionMode="map"
            />
            <PassIncludeControl
              matchedPasses={matchedPasses}
              includedPassIdSet={includedPassIdSet}
              onSetPassIncluded={actions.onSetPassIncluded}
              onApplySelection={actions.onApplyPassSelection}
            />
          </main>
        </div>
      </div>
    </>
  );
};
