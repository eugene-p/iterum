import { useMemo, useState } from "react";
import { SegmentDetailMap } from "../../app/SegmentDetailMap";
import type { StretchEditSession } from "../../../hooks/useStretchEditSession";
import { buildSplitMapPreview } from "../../../lib/mapHighlights";
import {
  stretchDisplayName,
  stretchDisplayNumber,
} from "../../../lib/stretchEdit";
import type { Segment, Stretch, TrackPoint } from "../../../types";
import { StretchNameInput } from "./StretchNameInput";
import { StretchStripEditor } from "./StretchStripEditor";
import { stretchStripEditorStyles as styles } from "./StretchStripEditor.styles";

type MapRoute = { id: number; points: TrackPoint[]; selected: boolean };
type StretchOverlay = { id: number | string; points: TrackPoint[]; color: string };

type StretchEditWorkspaceProps = {
  segment: Segment;
  session: StretchEditSession;
  selectedIndex: number | null;
  stretches: Stretch[];
  mapRoutes: MapRoute[];
  segmentHighlightPoints: TrackPoint[];
  stretchOverlays: StretchOverlay[];
  convertOpen: boolean;
  convertName: string;
  convertBusy: boolean;
  onConvertNameChange: (name: string) => void;
  onOpenConvert: () => void;
  onCloseConvert: () => void;
  onConfirmConvert: () => void;
  onClose: () => void;
};

/**
 * Stretch edit layout:
 * | map (larger) | list |
 * | editor (full width) |
 */
export const StretchEditWorkspace = ({
  segment,
  session,
  selectedIndex,
  stretches,
  mapRoutes,
  segmentHighlightPoints,
  stretchOverlays,
  convertOpen,
  convertName,
  convertBusy,
  onConvertNameChange,
  onOpenConvert,
  onCloseConvert,
  onConfirmConvert,
  onClose,
}: StretchEditWorkspaceProps) => {
  const [splitCutM, setSplitCutM] = useState<number | null>(null);

  const splitPreview = useMemo(() => {
    if (splitCutM == null || selectedIndex == null) return null;
    return buildSplitMapPreview(
      segmentHighlightPoints,
      stretches,
      selectedIndex,
      splitCutM,
    );
  }, [splitCutM, selectedIndex, segmentHighlightPoints, stretches]);

  const mapOverlays = splitPreview?.overlays.length
    ? splitPreview.overlays
    : stretchOverlays;

  const pointMarkers =
    splitPreview?.cutMarker != null
      ? [
          {
            id: "split-cut",
            lat: splitPreview.cutMarker.lat,
            lon: splitPreview.cutMarker.lon,
            color: "#f59e0b",
          },
        ]
      : [];

  return (
    <div className={styles.workspace}>
      <div className={styles.workspaceTop}>
        <div className={styles.workspaceMap}>
          <SegmentDetailMap
            routes={mapRoutes}
            segment={segment}
            segmentHighlightPoints={segmentHighlightPoints}
            stretchOverlays={mapOverlays}
            pointMarkers={pointMarkers}
          />
        </div>
        <div className={styles.workspaceList}>
          <table className={styles.workspaceListTable}>
            <thead>
              <tr>
                <th className={styles.workspaceListTh}>#</th>
                <th className={styles.workspaceListTh}>Name</th>
                <th className={styles.workspaceListTh}>Kind</th>
                <th className={styles.workspaceListTh}>Len</th>
              </tr>
            </thead>
            <tbody>
              {stretches.map((stretch, arrayIndex) => (
                <tr
                  key={`stretch-row-${arrayIndex}`}
                  className={styles.workspaceListRow(arrayIndex === selectedIndex)}
                  onClick={() => session.selectStretchIndex(arrayIndex)}
                >
                  <td className={styles.workspaceListTd}>
                    {stretchDisplayNumber(arrayIndex)}
                  </td>
                  <td className={styles.workspaceListTd}>
                    <StretchNameInput
                      arrayIndex={arrayIndex}
                      name={stretch.name}
                      placeholder={stretchDisplayName({ ...stretch, name: null })}
                      ariaLabel={`Name for stretch ${stretchDisplayNumber(arrayIndex)}`}
                      onRename={session.renameStretch}
                      onActivate={() => session.selectStretchIndex(arrayIndex)}
                    />
                  </td>
                  <td className={styles.workspaceListTd}>{stretch.kind}</td>
                  <td className={styles.workspaceListTd}>
                    {Math.round(stretch.length_m)} m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.workspaceEditor}>
        <StretchStripEditor
          session={session}
          selectedIndex={selectedIndex}
          convertOpen={convertOpen}
          convertName={convertName}
          convertBusy={convertBusy}
          onConvertNameChange={onConvertNameChange}
          onOpenConvert={onOpenConvert}
          onCloseConvert={onCloseConvert}
          onConfirmConvert={onConfirmConvert}
          onCloseWorkspace={onClose}
          onSplitCutChange={setSplitCutM}
        />
      </div>
    </div>
  );
};
