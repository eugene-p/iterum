import { appStyles } from "../../App.styles";
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
import { Badge, MutedSpan } from "../ui";
import { SegmentActionsBar } from "./SegmentActionsBar";
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
  <div className={appStyles.segmentMode}>
    <div className={appStyles.segmentModeInfo}>
      <Badge>Segment</Badge>
      <MutedSpan>{segment.name}</MutedSpan>
      {selectedPass && (
        <span className={appStyles.segmentModeActivity}>
          <MutedSpan>
            {selectedPass.activity_name}
            {" · "}pass {selectedPass.pass_number}
            {selectedStretch && selectedPassStretchMetrics ? (
              <>
                {" "}
                · stretch {selectedStretch.index} ({stretchKindLabel(selectedStretch.kind)})
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
    />
  </div>
);