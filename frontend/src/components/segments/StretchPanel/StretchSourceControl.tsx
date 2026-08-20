import { useEffect, useMemo, useState } from "react";
import type { SegmentPass } from "../../../types";
import { Button, Field, Modal, ModalHeader, MutedText, Select } from "../../ui";
import { stretchPanelStyles } from "./StretchPanel.styles";
import {
  stretchSourceLabel,
  stretchSourceOptionsFromPasses,
} from "./stretchSourceOptions";

type StretchSourceControlProps = {
  open: boolean;
  onClose: () => void;
  passes: ReadonlyArray<SegmentPass>;
  stretchSourcePassId?: number | null;
  stretchSourceActivityId?: number | null;
  onSetStretchSource: (activityId: number) => void;
  loading?: boolean;
};

/**
 * Confirm dialog to change stretch geometry source.
 * Opened from header Actions — not an always-visible picker.
 */
export const StretchSourceControl = ({
  open,
  onClose,
  passes,
  stretchSourcePassId,
  stretchSourceActivityId,
  onSetStretchSource,
  loading = false,
}: StretchSourceControlProps) => {
  const options = useMemo(() => stretchSourceOptionsFromPasses(passes), [passes]);
  const currentActivityId =
    options.find((option) => option.passId === stretchSourcePassId)?.activityId ??
    stretchSourceActivityId ??
    options[0]?.activityId ??
    null;
  const currentLabel = stretchSourceLabel(options, stretchSourcePassId, currentActivityId);

  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedActivityId(currentActivityId);
  }, [open, currentActivityId]);

  const canConfirm =
    selectedActivityId != null &&
    selectedActivityId !== currentActivityId &&
    !loading &&
    options.length > 1;

  return (
    <Modal open={open} onClose={onClose} panelClassName={stretchPanelStyles.sourceModalPanel}>
      <ModalHeader title="Change source" onClose={onClose} />
      <MutedText className={stretchPanelStyles.sourceWarning}>
        Only if the current source is bad (noisy GPS or wrong cuts). Boundaries recompute —
        climb, flat, and descent cuts can move for every pass.
      </MutedText>
      <MutedText className={stretchPanelStyles.sourceLabel}>
        Current: <strong>{currentLabel}</strong>
      </MutedText>
      <Field
        label="Source activity"
        className={stretchPanelStyles.sourceSelectLabel}
        labelClassName={stretchPanelStyles.sourceFieldCaption}
      >
        <Select
          className={stretchPanelStyles.sourceSelect}
          value={selectedActivityId ?? ""}
          disabled={loading || options.length < 2}
          aria-label="Source activity"
          onChange={(event) => {
            const nextId = Number(event.target.value);
            setSelectedActivityId(Number.isFinite(nextId) ? nextId : null);
          }}
        >
          {options.map((option) => (
            <option key={option.activityId} value={option.activityId}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className={stretchPanelStyles.sourceModalActions}>
        <Button size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          disabled={!canConfirm}
          onClick={() => {
            if (!canConfirm || selectedActivityId == null) return;
            onSetStretchSource(selectedActivityId);
            onClose();
          }}
        >
          Change source
        </Button>
      </div>
    </Modal>
  );
};
