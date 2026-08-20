import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { Button, Field, HintButton, Input, Row } from "../../ui";
import { DEFAULT_STRETCH_THRESHOLDS } from "../../../stretchUtils";
import type { StretchThresholds } from "../../../types";
import {
  STRETCH_THRESHOLD_FIELD_HINTS,
  STRETCH_THRESHOLD_GROUP_TITLES,
} from "./stretchThresholdHints";
import { stretchPanelStyles } from "./StretchPanel.styles";

type StretchThresholdSettingsProps = {
  draft: StretchThresholds;
  onDraftChange: (next: StretchThresholds) => void;
  onPreview?: (thresholds: StretchThresholds) => void;
  showPreview?: boolean;
  layout?: "grid" | "sections";
  defaultThresholds?: StretchThresholds;
  loading?: boolean;
  settingsGridClassName?: string;
};

const updateDraftField =
  <K extends keyof StretchThresholds>(key: K, value: number) =>
  (prev: StretchThresholds): StretchThresholds => ({ ...prev, [key]: value });

type StretchThresholdFieldProps = {
  label: string;
  hint: string;
  children: ReactNode;
};

const StretchThresholdField = ({ label, hint, children }: StretchThresholdFieldProps) => (
  <Field
    label={
      <>
        <span>{label}</span>
        <HintButton text={hint} placement="top" />
      </>
    }
    className={stretchPanelStyles.settingLabel}
    labelClassName={stretchPanelStyles.settingLabelRow}
  >
    {children}
  </Field>
);

type SettingsSectionProps = {
  title: string;
  gridClassName: string;
  children: ReactNode;
};

const SettingsSection = ({ title, gridClassName, children }: SettingsSectionProps) => (
  <div className={stretchPanelStyles.settingsSection}>
    <h4 className={stretchPanelStyles.settingsSectionTitle}>{title}</h4>
    <div className={gridClassName}>{children}</div>
  </div>
);

const StretchThresholdFields = ({
  draft,
  setField,
}: {
  draft: StretchThresholds;
  setField: <K extends keyof StretchThresholds>(key: K, value: number) => void;
}) => (
  <>
    <StretchThresholdField
      label="Climb grade (%)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.climb_grade_pct}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={0.5}
        value={draft.climb_grade_pct}
        onChange={(e) => setField("climb_grade_pct", Number(e.target.value))}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Descent grade (%)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.descent_grade_pct}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={0.5}
        value={draft.descent_grade_pct}
        onChange={(e) => setField("descent_grade_pct", Number(e.target.value))}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Grade hysteresis (%)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.grade_hysteresis_pct}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={0.5}
        min={0}
        value={draft.grade_hysteresis_pct}
        onChange={(e) => setField("grade_hysteresis_pct", Number(e.target.value))}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Min stretch (% of segment)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.min_stretch_pct}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={1}
        min={0}
        value={draft.min_stretch_pct * 100}
        onChange={(e) => setField("min_stretch_pct", Number(e.target.value) / 100)}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Min stretch (m)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.min_stretch_m}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={10}
        min={0}
        value={draft.min_stretch_m}
        onChange={(e) => setField("min_stretch_m", Number(e.target.value))}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Max stretch (% of segment)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.max_stretch_pct}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={1}
        min={0}
        value={draft.max_stretch_pct * 100}
        onChange={(e) => setField("max_stretch_pct", Number(e.target.value) / 100)}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Max stretch (m)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.max_stretch_m}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={50}
        min={0}
        value={draft.max_stretch_m}
        onChange={(e) => setField("max_stretch_m", Number(e.target.value))}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Resample spacing (m)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.resample_spacing_m}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={1}
        min={1}
        value={draft.resample_spacing_m}
        onChange={(e) => setField("resample_spacing_m", Number(e.target.value))}
      />
    </StretchThresholdField>
    <StretchThresholdField
      label="Grade window (m)"
      hint={STRETCH_THRESHOLD_FIELD_HINTS.grade_window_m}
    >
      <Input
        className={stretchPanelStyles.settingInput}
        type="number"
        step={5}
        min={5}
        value={draft.grade_window_m}
        onChange={(e) => setField("grade_window_m", Number(e.target.value))}
      />
    </StretchThresholdField>
  </>
);

export const StretchThresholdSettings = ({
  draft,
  onDraftChange,
  onPreview,
  showPreview = true,
  layout = "grid",
  defaultThresholds = DEFAULT_STRETCH_THRESHOLDS,
  loading = false,
  settingsGridClassName,
}: StretchThresholdSettingsProps) => {
  const setField = <K extends keyof StretchThresholds>(key: K, value: number) =>
    onDraftChange(updateDraftField(key, value)(draft));

  return (
    <>
      {showPreview && (
        <Row className={stretchPanelStyles.actions}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPreview?.(draft)}
            disabled={loading}
          >
            Preview
          </Button>
        </Row>
      )}

      {layout === "sections" ? (
        <div className={stretchPanelStyles.settingsSections}>
          <SettingsSection
            title={STRETCH_THRESHOLD_GROUP_TITLES.grade}
            gridClassName={stretchPanelStyles.settingsSectionGrid3}
          >
            <StretchThresholdField
              label="Climb grade (%)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.climb_grade_pct}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={0.5}
                value={draft.climb_grade_pct}
                onChange={(e) => setField("climb_grade_pct", Number(e.target.value))}
              />
            </StretchThresholdField>
            <StretchThresholdField
              label="Descent grade (%)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.descent_grade_pct}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={0.5}
                value={draft.descent_grade_pct}
                onChange={(e) => setField("descent_grade_pct", Number(e.target.value))}
              />
            </StretchThresholdField>
            <StretchThresholdField
              label="Grade hysteresis (%)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.grade_hysteresis_pct}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={0.5}
                min={0}
                value={draft.grade_hysteresis_pct}
                onChange={(e) => setField("grade_hysteresis_pct", Number(e.target.value))}
              />
            </StretchThresholdField>
          </SettingsSection>

          <SettingsSection
            title={STRETCH_THRESHOLD_GROUP_TITLES.stretchLength}
            gridClassName={stretchPanelStyles.settingsSectionGrid2}
          >
            <StretchThresholdField
              label="Min stretch (% of segment)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.min_stretch_pct}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={1}
                min={0}
                value={draft.min_stretch_pct * 100}
                onChange={(e) => setField("min_stretch_pct", Number(e.target.value) / 100)}
              />
            </StretchThresholdField>
            <StretchThresholdField
              label="Min stretch (m)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.min_stretch_m}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={10}
                min={0}
                value={draft.min_stretch_m}
                onChange={(e) => setField("min_stretch_m", Number(e.target.value))}
              />
            </StretchThresholdField>
            <StretchThresholdField
              label="Max stretch (% of segment)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.max_stretch_pct}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={1}
                min={0}
                value={draft.max_stretch_pct * 100}
                onChange={(e) => setField("max_stretch_pct", Number(e.target.value) / 100)}
              />
            </StretchThresholdField>
            <StretchThresholdField
              label="Max stretch (m)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.max_stretch_m}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={50}
                min={0}
                value={draft.max_stretch_m}
                onChange={(e) => setField("max_stretch_m", Number(e.target.value))}
              />
            </StretchThresholdField>
          </SettingsSection>

          <SettingsSection
            title={STRETCH_THRESHOLD_GROUP_TITLES.sampling}
            gridClassName={stretchPanelStyles.settingsSectionGrid2}
          >
            <StretchThresholdField
              label="Resample spacing (m)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.resample_spacing_m}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={1}
                min={1}
                value={draft.resample_spacing_m}
                onChange={(e) => setField("resample_spacing_m", Number(e.target.value))}
              />
            </StretchThresholdField>
            <StretchThresholdField
              label="Grade window (m)"
              hint={STRETCH_THRESHOLD_FIELD_HINTS.grade_window_m}
            >
              <Input
                className={stretchPanelStyles.settingInput}
                type="number"
                step={5}
                min={5}
                value={draft.grade_window_m}
                onChange={(e) => setField("grade_window_m", Number(e.target.value))}
              />
            </StretchThresholdField>
          </SettingsSection>
        </div>
      ) : (
        <div className={cn(stretchPanelStyles.settingsGrid, settingsGridClassName)}>
          <StretchThresholdFields draft={draft} setField={setField} />
        </div>
      )}

      <Row className={stretchPanelStyles.actionsFooter}>
        <Button size="sm" onClick={() => onDraftChange(defaultThresholds)} disabled={loading}>
          Reset defaults
        </Button>
      </Row>
    </>
  );
};
