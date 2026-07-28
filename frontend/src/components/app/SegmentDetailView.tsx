import { useMemo } from "react";
import { appStyles } from "../../App.styles";
import { stretchKindLabel } from "../../stretchUtils";
import {
  formatDistance,
  formatDuration,
  formatHr,
  formatPaceFromSpeed,
  formatSpeed,
} from "../../utils";
import { PassDateProfileRow } from "../profiles/PassDateProfileRow";
import { PassIncludeControl } from "../segments/PassIncludeControl";
import { SegmentDetailMap } from "./SegmentDetailMap";
import { StretchPanel } from "../segments/StretchPanel";
import { Badge, MutedSpan } from "../ui";
import { SegmentActionsBar } from "./SegmentActionsBar";
import type { SegmentDetailViewProps } from "./segmentDetailTypes";

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

  return (
    <div className={appStyles.segmentDetail}>
      <div className={appStyles.segmentMode}>
        <div className={appStyles.segmentModeInfo}>
          <Badge>Segment</Badge>
          <MutedSpan>{segment.name}</MutedSpan>
          {selectedPass && (
            <span className={appStyles.segmentModeActivity}>
              <MutedSpan>
                {selectedPass.activity_name}
                {" · "}pass {selectedPass.pass_number}
                {stretch.selectedStretch && stretch.selectedPassStretchMetrics ? (
                  <>
                    {" "}
                    · stretch {stretch.selectedStretch.index} (
                    {stretchKindLabel(stretch.selectedStretch.kind)})
                    {" · "}
                    {formatDistance(stretch.selectedPassStretchMetrics.distance_m)}
                    {" · "}
                    {formatDuration(stretch.selectedPassStretchMetrics.duration_sec)}
                    {" · "}
                    {formatSpeed(stretch.selectedPassStretchMetrics.avg_speed_kmh)}
                    {" · "}
                    {formatPaceFromSpeed(stretch.selectedPassStretchMetrics.avg_speed_kmh)}
                    {" · "}
                    {formatHr(stretch.selectedPassStretchMetrics.avg_hr)}
                  </>
                ) : (
                  <>
                    {" · "}
                    {formatDuration(selectedPass.duration_sec)} · {formatHr(selectedPass.avg_hr)}
                  </>
                )}
              </MutedSpan>
              <PassDateProfileRow
                pass={selectedPass}
                started_at={selectedPass.started_at}
                name={selectedPass.activity_name}
                source_filename={selectedPass.source_filename}
              />
            </span>
          )}
        </div>
        <SegmentActionsBar
          segment={segment}
          comparison={comparison}
          loading={headerActions.loading}
          editError={headerActions.editError}
          onSegmentSaved={headerActions.onSegmentSaved}
          onComparePasses={headerActions.onComparePasses}
          onReverse={headerActions.onReverse}
          onRescan={headerActions.onRescan}
          onDelete={headerActions.onDelete}
          stretchSourcePassId={headerActions.stretchSourcePassId}
          stretchSourceActivityId={headerActions.stretchSourceActivityId}
          onSetStretchSource={headerActions.onSetStretchSource}
        />
      </div>
      <div className={appStyles.detailBody}>
        <div className={appStyles.detailPrimary}>
          <PassIncludeControl
            matchedPasses={matchedPasses}
            includedPassIdSet={includedPassIdSet}
            onSetPassIncluded={actions.onSetPassIncluded}
            onApplySelection={actions.onApplyPassSelection}
          />
          <StretchPanel
            stretches={comparison?.stretches ?? []}
            fullPassMetrics={stretch.fullPassMetrics}
            thresholds={stretch.thresholds}
            reason={comparison?.stretch_reason}
            stretchState={stretch.stretchState}
            stretchCanSave={stretch.stretchCanSave}
            selectedStretchIndex={stretch.selectedStretchIndex}
            selectedStretch={stretch.selectedStretch}
            stretchPassMetrics={stretch.stretchPassMetrics}
            stretchSourcePassId={stretch.stretchSourcePassId}
            onSelectStretch={actions.onSelectStretch}
            onClearStretchSelection={actions.onClearStretchSelection}
            onExcludeIncludedPass={actions.onExcludeIncludedPass}
            includedPassCount={includedPassIdSet.size}
            onPreviewThresholds={actions.onPreviewStretchThresholds}
            onResetStretchPreview={actions.onResetStretchPreview}
            onSaveStretches={actions.onSaveStretches}
            defaultThresholds={stretch.defaultThresholds}
            loading={stretch.loading}
          />
        </div>
        <div className={appStyles.detailMapPane}>
          <SegmentDetailMap
            routes={map.routes}
            segment={segment}
            segmentHighlightPoints={map.segmentHighlightPoints}
            stretchOverlays={map.stretchOverlays}
          />
        </div>
      </div>
    </div>
  );
};
