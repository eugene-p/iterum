import { useEffect, useState } from "react";
import { DEFAULT_STRETCH_THRESHOLDS } from "../../../stretchUtils";
import type { StretchThresholds } from "../../../types";
import { Button, MutedText } from "../../ui";
import { StretchThresholdSettings } from "./StretchThresholdSettings";
import { stretchPanelStyles as styles } from "./StretchPanel.styles";

type StretchDerivationControlsProps = {
  thresholds?: StretchThresholds;
  defaultThresholds?: StretchThresholds;
  canSave?: boolean;
  loading?: boolean;
  locked?: boolean;
  onPreview: (thresholds: StretchThresholds) => void;
  onReset: () => void;
  onSave: () => void;
};

/** Threshold adjustment belongs in the dedicated stretch editor, not comparison. */
export const StretchDerivationControls = ({
  thresholds,
  defaultThresholds = DEFAULT_STRETCH_THRESHOLDS,
  canSave = false,
  loading = false,
  locked = false,
  onPreview,
  onReset,
  onSave,
}: StretchDerivationControlsProps) => {
  const resolvedThresholds = thresholds ?? defaultThresholds;
  const [draft, setDraft] = useState<StretchThresholds>(resolvedThresholds);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDraft(resolvedThresholds);
  }, [resolvedThresholds]);

  return (
    <section className={styles.derivationControls} aria-labelledby="stretch-derivation-title">
      <div className={styles.derivationHeader}>
        <div>
          <h2 id="stretch-derivation-title" className={styles.derivationTitle}>Derivation</h2>
          <p className={styles.derivationHint}>Adjust how elevation changes suggest initial stretches.</p>
        </div>
        <div className={styles.actions}>
          <Button size="sm" onClick={() => setOpen((value) => !value)} disabled={locked}>
            {open ? "Hide thresholds" : "Adjust thresholds"}
          </Button>
          {canSave && !locked ? (
            <>
              <Button size="sm" onClick={onReset} disabled={loading}>Reset</Button>
              <Button variant="primary" size="sm" onClick={onSave} disabled={loading}>Save</Button>
            </>
          ) : null}
        </div>
      </div>
      {canSave && !locked ? (
        <MutedText className={styles.hint}>Unsaved derivation changes. Save to keep, or reset to discard.</MutedText>
      ) : null}
      {open && !locked ? (
        <StretchThresholdSettings
          draft={draft}
          onDraftChange={setDraft}
          onPreview={onPreview}
          defaultThresholds={defaultThresholds}
          loading={loading}
          layout="sections"
        />
      ) : null}
    </section>
  );
};
