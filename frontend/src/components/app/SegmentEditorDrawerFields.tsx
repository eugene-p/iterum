import type { SegmentEditorMode } from "../../hooks/segmentEditorTypes";
import type { Segment } from "../../types";
import { ActivityMap } from "../maps/ActivityMap";
import { Button, EmptySurface, ErrorText, HintButton, Input } from "../ui";
import { entityEditDrawerStyles } from "./entityEditDrawerStyles";
import type { SegmentEditorFormState, SegmentEditorMapState } from "./segmentEditorTypes";

const ALIGNMENT_HINT =
  "Click Set start, then pick a point on the route. Set end marks the finish. Clear resets both points.";

const MATCH_RADIUS_HINT =
  "How close a pass must be to each segment endpoint, in meters. Larger values tolerate more GPS drift.";

const MATCH_THRESHOLD_HINT =
  "How similar a pass route must be to this segment (0.5–1). Higher values require a closer match.";

type SegmentEditorDrawerFieldsProps = {
  segmentEditor: SegmentEditorMode;
  form: SegmentEditorFormState;
  map: SegmentEditorMapState;
  selectedSegment: Segment | null;
  onNameChange: (value: string) => void;
  onPickStart: () => void;
  onPickEnd: () => void;
  onClearDraft: () => void;
  onRadiusChange: (value: number) => void;
  onMatchThresholdChange: (value: number) => void;
  onMapClick: (lat: number, lon: number) => void;
};

export const SegmentEditorDrawerFields = ({
  segmentEditor,
  form,
  map,
  selectedSegment,
  onNameChange,
  onPickStart,
  onPickEnd,
  onClearDraft,
  onRadiusChange,
  onMatchThresholdChange,
  onMapClick,
}: SegmentEditorDrawerFieldsProps) => (
  <>
    <Input
      value={form.name}
      onChange={(e) => onNameChange(e.target.value)}
      placeholder="Segment name"
      autoFocus
    />

    <div className={entityEditDrawerStyles.segmentAdjustSection}>
      <div className={entityEditDrawerStyles.segmentAdjustRow}>
        <Button
          variant={form.pickMode === "start" ? "primary" : "default"}
          className={entityEditDrawerStyles.segmentAdjustButton}
          onClick={onPickStart}
        >
          {form.pickMode === "start" ? "Click map…" : "Set start"}
        </Button>
        <Button
          variant={form.pickMode === "end" ? "primary" : "default"}
          className={entityEditDrawerStyles.segmentAdjustButton}
          disabled={form.draft.start_lat == null}
          onClick={onPickEnd}
        >
          {form.pickMode === "end" ? "Click map…" : "Set end"}
        </Button>
        <Button className={entityEditDrawerStyles.segmentAdjustButton} onClick={onClearDraft}>
          Clear
        </Button>
        <label className={entityEditDrawerStyles.segmentAdjustField}>
          <span className={entityEditDrawerStyles.segmentAdjustLabelRow}>
            <span className={entityEditDrawerStyles.label}>Match radius (m)</span>
            <HintButton text={MATCH_RADIUS_HINT} placement="top" />
          </span>
          <Input
            type="number"
            min={5}
            max={200}
            className={entityEditDrawerStyles.segmentAdjustInput}
            value={form.radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
          />
        </label>
        <label className={entityEditDrawerStyles.segmentAdjustField}>
          <span className={entityEditDrawerStyles.segmentAdjustLabelRow}>
            <span className={entityEditDrawerStyles.label}>Match threshold (0–1)</span>
            <HintButton text={MATCH_THRESHOLD_HINT} placement="top" />
          </span>
          <Input
            type="number"
            min={0.5}
            max={1}
            step={0.05}
            className={entityEditDrawerStyles.segmentAdjustInput}
            value={form.matchThreshold}
            onChange={(e) => onMatchThresholdChange(Number(e.target.value))}
          />
        </label>
        <div className={entityEditDrawerStyles.segmentAdjustHint}>
          <HintButton
            text={ALIGNMENT_HINT}
            size="lg"
            placement="top"
            popoverClassName={entityEditDrawerStyles.segmentAdjustHintPopover}
          />
        </div>
      </div>
      {form.notice && form.pickMode !== "none" && (
        <p className={entityEditDrawerStyles.pickNotice}>{form.notice}</p>
      )}
    </div>

    <div className={entityEditDrawerStyles.mapWrap}>
      {map.routes.length ? (
        <ActivityMap
          key={map.routes[0]?.id}
          routes={map.routes}
          segment={segmentEditor.kind === "edit" ? selectedSegment : null}
          segmentDraft={form.draft}
          segmentHighlight={map.parentSegmentHighlight}
          draftHighlight={map.draftHighlightPoints}
          segmentMode={form.pickMode}
          onMapClick={onMapClick}
        />
      ) : (
        <EmptySurface style={{ height: "100%" }}>Loading activity route…</EmptySurface>
      )}
    </div>

    {form.error && <ErrorText>{form.error}</ErrorText>}
  </>
);