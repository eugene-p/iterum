import { stretchKindLabel } from "../../stretchUtils";
import type { SegmentPass } from "../../types";
import {
  formatDistance,
  formatDuration,
  formatHr,
  formatPaceFromSpeed,
  formatSpeed,
} from "../../utils";
import { PassDateProfileRow } from "../profiles/PassDateProfileRow";
import { SegmentActionsBar } from "./SegmentActionsBar";
import { DetailHeader } from "./DetailHeader";
import type { PassStretchMetrics, SegmentHeaderActions } from "./segmentDetailTypes";
import type { Segment, SegmentCompare, Stretch } from "../../types";

type SegmentDetailHeaderProps = {
  segment: Segment;
  comparison: SegmentCompare | null;
  selectedPass: SegmentPass | null;
  selectedStretch: Stretch | null;
  selectedPassStretchMetrics: PassStretchMetrics | null;
  headerActions: SegmentHeaderActions;
};

export const SegmentDetailHeader = ({
  segment,
  comparison,
  selectedPass,
  selectedStretch,
  selectedPassStretchMetrics,
  headerActions,
}: SegmentDetailHeaderProps) => (
  <DetailHeader
    typeLabel="Segment"
    title={segment.name}
    metadata={selectedPass ? (
      <span className="inline-flex flex-wrap items-center gap-2 text-xs text-muted">
            {selectedPass.activity_name}
            {" · "}pass {selectedPass.pass_number}
            {selectedStretch && selectedPassStretchMetrics ? (
              <>
                {" "}
                · stretch {selectedStretch.index + 1} ({stretchKindLabel(selectedStretch.kind)})
                {" · "}
                {formatDistance(selectedPassStretchMetrics.distance_m)}
                {" · "}
                {formatDuration(selectedPassStretchMetrics.duration_sec)}
                {" · "}
                {formatSpeed(selectedPassStretchMetrics.avg_speed_kmh)}
                {" · "}
                {formatPaceFromSpeed(selectedPassStretchMetrics.avg_speed_kmh)}
                {" · "}
                {formatHr(selectedPassStretchMetrics.avg_hr)}
              </>
            ) : (
              <>
                {" · "}
                {formatDuration(selectedPass.duration_sec)} · {formatHr(selectedPass.avg_hr)}
              </>
            )}
          <PassDateProfileRow
            pass={selectedPass}
            started_at={selectedPass.started_at}
            name={selectedPass.activity_name}
            source_filename={selectedPass.source_filename}
          />
      </span>
    ) : undefined}
    actions={<SegmentActionsBar
      segment={segment}
      comparison={comparison}
      loading={headerActions.loading}
      editError={headerActions.editError}
      onSegmentSaved={headerActions.onSegmentSaved}
      onComparePasses={headerActions.onComparePasses}
      onEditStretches={headerActions.onEditStretches}
      onReverse={headerActions.onReverse}
      onRescan={headerActions.onRescan}
      onDelete={headerActions.onDelete}
      stretchSourcePassId={headerActions.stretchSourcePassId}
      stretchSourceActivityId={headerActions.stretchSourceActivityId}
      onSetStretchSource={headerActions.onSetStretchSource}
    />}
  />
);
