import type { SegmentEditorMode } from "../../hooks/segmentEditorTypes";
import type { Segment } from "../../types";
import { MIN_LOOP_PATH_DISTANCE_M } from "../../utils";
import { ActivityMap } from "../maps/ActivityMap";
import { Button, EmptySurface, ErrorText, Field, HintButton, Input } from "../ui";
import { entityEditDrawerStyles } from "./entityEditDrawerStyles";
import type { SegmentEditorFormState, SegmentEditorMapState } from "./segmentEditorTypes";

const MATCH_RADIUS_HINT =
  "How close a pass must be to each segment endpoint, in meters. Larger values tolerate more GPS drift.";

const MATCH_THRESHOLD_HINT =
  "How similar a pass route must be to this segment (0.5–1). Higher values require a closer match.";

const LOOP_MIN_PATH_DISCLAIMER = `Segments and loops under ${MIN_LOOP_PATH_DISTANCE_M} m path distance are not matched.`;

type SegmentEditorDrawerFieldsProps = {
  segmentEditor: SegmentEditorMode;
  form: SegmentEditorFormState;
  map: SegmentEditorMapState;
  selectedSegment: Segment | null;
  onNameChange: (value: string) => void;
  onPickStart: () => void;
  onPickEnd: () => void;
  onCloseLoop: () => void;
  onClearDraft: () => void;
  onRadiusChange: (value: number) => void;
  onMatchThresholdChange: (value: number) => void;
  onMapClick: (lat: number, lon: number) => void;
};

const PathBar = ({
  hasStart,
  hasEnd,
  pickMode,
  onPickStart,
  onCloseLoop,
  onClearDraft,
}: {
  hasStart: boolean;
  hasEnd: boolean;
  pickMode: SegmentEditorFormState["pickMode"];
  onPickStart: () => void;
  onCloseLoop: () => void;
  onClearDraft: () => void;
}) => {
  const reselectingStart = hasStart && pickMode === "start";

  if (!hasStart || reselectingStart) {
    return (
      <div className={entityEditDrawerStyles.pathToolbarMain} aria-label="Path: set start">
        {pickMode !== "start" ? (
          <Button
            variant="primary"
            size="sm"
            className={entityEditDrawerStyles.segmentAdjustButton}
            onClick={onPickStart}
          >
            Select start
          </Button>
        ) : (
          <span className={entityEditDrawerStyles.pathMapPrompt} aria-live="polite">
            Click map for start
          </span>
        )}
      </div>
    );
  }

  if (!hasEnd) {
    return (
      <div className={entityEditDrawerStyles.pathEndStep} aria-label="Path: set end">
        <div className={entityEditDrawerStyles.pathToolbarMain}>
          <span className={entityEditDrawerStyles.pathMarker}>
            <span className={entityEditDrawerStyles.pathMarkerDotStart} aria-hidden />
            Start set
          </span>
          <Button
            size="sm"
            className={entityEditDrawerStyles.segmentAdjustButton}
            onClick={onPickStart}
          >
            Reselect start
          </Button>
          <span className={entityEditDrawerStyles.pathMapPrompt} aria-live="polite">
            Click map for end
          </span>
          <Button
            size="sm"
            className={entityEditDrawerStyles.segmentAdjustButton}
            onClick={onCloseLoop}
          >
            Same as start
          </Button>
        </div>
        <p className={entityEditDrawerStyles.pathDisclaimer}>{LOOP_MIN_PATH_DISCLAIMER}</p>
      </div>
    );
  }

  return (
    <div className={entityEditDrawerStyles.pathToolbarMain} aria-label="Path: complete">
      <span className={entityEditDrawerStyles.pathMarker}>
        <span className={entityEditDrawerStyles.pathMarkerDotStart} aria-hidden />
        Start
      </span>
      <span className={entityEditDrawerStyles.pathMarker}>
        <span className={entityEditDrawerStyles.pathMarkerDotEnd} aria-hidden />
        End
      </span>
      <span className={entityEditDrawerStyles.pathDone}>set</span>
      <Button
        size="sm"
        className={entityEditDrawerStyles.segmentAdjustButton}
        onClick={onClearDraft}
      >
        Reset path
      </Button>
    </div>
  );
};

export const SegmentEditorDrawerFields = ({
  segmentEditor,
  form,
  map,
  selectedSegment,
  onNameChange,
  onPickStart,
  onPickEnd: _onPickEnd,
  onCloseLoop,
  onClearDraft,
  onRadiusChange,
  onMatchThresholdChange,
  onMapClick,
}: SegmentEditorDrawerFieldsProps) => {
  const hasStart = form.draft.start_lat != null;
  const hasEnd = form.draft.end_lat != null;

  const segmentMode =
    form.pickMode === "start"
      ? "start"
      : hasStart && !hasEnd
        ? "end"
        : "none";

  return (
    <>
      <Input
        value={form.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Segment name"
        autoFocus
      />

      <div className={entityEditDrawerStyles.segmentAdjustSection}>
        <div className={entityEditDrawerStyles.pathToolbar}>
          <PathBar
            hasStart={hasStart}
            hasEnd={hasEnd}
            pickMode={form.pickMode}
            onPickStart={onPickStart}
            onCloseLoop={onCloseLoop}
            onClearDraft={onClearDraft}
          />
          {hasStart && hasEnd && (
            <div className={entityEditDrawerStyles.matchRow} aria-label="Match settings">
              <Field
                label={
                  <>
                    <span>Radius (m)</span>
                    <HintButton text={MATCH_RADIUS_HINT} placement="top" />
                  </>
                }
                className={entityEditDrawerStyles.segmentAdjustField}
                labelClassName={entityEditDrawerStyles.segmentAdjustLabelRow}
              >
                <Input
                  type="number"
                  min={5}
                  max={200}
                  className={entityEditDrawerStyles.segmentAdjustInput}
                  value={form.radius}
                  onChange={(e) => onRadiusChange(Number(e.target.value))}
                />
              </Field>
              <Field
                label={
                  <>
                    <span>Match</span>
                    <HintButton text={MATCH_THRESHOLD_HINT} placement="top" />
                  </>
                }
                className={entityEditDrawerStyles.segmentAdjustField}
                labelClassName={entityEditDrawerStyles.segmentAdjustLabelRow}
              >
                <Input
                  type="number"
                  min={0.5}
                  max={1}
                  step={0.05}
                  className={entityEditDrawerStyles.segmentAdjustInput}
                  value={form.matchThreshold}
                  onChange={(e) => onMatchThresholdChange(Number(e.target.value))}
                />
              </Field>
            </div>
          )}
        </div>
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
            segmentMode={segmentMode}
            onMapClick={onMapClick}
          />
        ) : (
          <EmptySurface style={{ height: "100%" }}>Loading activity route…</EmptySurface>
        )}
      </div>

      {form.error && <ErrorText>{form.error}</ErrorText>}
    </>
  );
};
