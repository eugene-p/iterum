import { useEffect, useMemo, useState } from "react";
import { Button, CollapsibleSection, MutedText } from "../../ui";
import {
  comparisonBaselineFromStretches,
  comparisonBaselineFromStretch,
  stretchKindLabel,
  type StretchPassMetrics,
} from "../../../stretchUtils";
import type { SegmentPass, Stretch, StretchState, StretchThresholds } from "../../../types";
import { DEFAULT_STRETCH_THRESHOLDS } from "../../../stretchUtils";
import { formatDistance } from "../../../utils";
import { stretchPanelStyles } from "./StretchPanel.styles";
import { StretchThresholdSettings } from "./StretchThresholdSettings";
import { StretchComparisonTable } from "./StretchComparisonTable";

type StretchPanelProps = {
  stretches: Stretch[];
  fullPassMetrics?: StretchPassMetrics[];
  thresholds?: StretchThresholds;
  reason?: string | null;
  stretchState?: StretchState;
  stretchCanSave?: boolean;
  selectedStretchIndex?: number | null;
  selectedStretch?: Stretch | null;
  stretchPassMetrics?: StretchPassMetrics[];
  stretchSourcePassId?: number | null;
  onSelectStretch?: (stretch: Stretch) => void;
  onClearStretchSelection?: () => void;
  onExcludeIncludedPass?: (pass: SegmentPass) => void;
  includedPassCount?: number;
  onPreviewThresholds: (thresholds: StretchThresholds) => void;
  onResetStretchPreview: () => void;
  onSaveStretches: () => void;
  defaultThresholds?: StretchThresholds;
  loading?: boolean;
};

export const StretchPanel = ({
  stretches,
  fullPassMetrics = [],
  thresholds,
  reason,
  selectedStretchIndex = null,
  selectedStretch,
  stretchPassMetrics = [],
  stretchSourcePassId,
  onSelectStretch,
  onClearStretchSelection,
  onExcludeIncludedPass,
  includedPassCount = 0,
  stretchState = "saved",
  stretchCanSave = false,
  onPreviewThresholds,
  onResetStretchPreview,
  onSaveStretches,
  defaultThresholds = DEFAULT_STRETCH_THRESHOLDS,
  loading = false,
}: StretchPanelProps) => {
  const resolvedThresholds = thresholds ?? defaultThresholds;
  const [draft, setDraft] = useState<StretchThresholds>(resolvedThresholds);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const stretchSelected = selectedStretchIndex != null;

  useEffect(() => {
    setDraft(resolvedThresholds);
  }, [resolvedThresholds]);

  const fullSegmentBaseline = useMemo(
    () => comparisonBaselineFromStretches(stretches),
    [stretches],
  );
  const comparisonRows = stretchSelected ? stretchPassMetrics : fullPassMetrics;
  const comparisonBaseline =
    stretchSelected && selectedStretch
      ? comparisonBaselineFromStretch(selectedStretch)
      : fullSegmentBaseline;
  const comparisonLoading = Boolean(
    stretchSelected && loading && !stretchPassMetrics.length,
  );

  const handleClearSelection = () => {
    onClearStretchSelection?.();
  };

  return (
    <CollapsibleSection
      variant="panel"
      title="Stretches"
      headingLevel="h2"
      expanded={expanded}
      onToggle={() => setExpanded((open) => !open)}
      meta={
        <>
          {stretches.length
            ? `${stretches.length} stretch${stretches.length === 1 ? "" : "es"}`
            : "No stretches"}
          {stretchState === "preview" ? " · preview" : ""}
          {stretchSelected && selectedStretch
            ? ` · ${stretchKindLabel(selectedStretch.kind)} #${selectedStretch.index}`
            : " · full segment"}
        </>
      }
    >
      <div className={stretchPanelStyles.actions}>
        <Button size="sm" onClick={() => setSettingsOpen((open) => !open)}>
          {settingsOpen ? "Hide thresholds" : "Adjust thresholds"}
        </Button>
        {stretchCanSave && (
          <>
            <Button size="sm" onClick={onResetStretchPreview} disabled={loading}>
              Reset
            </Button>
            <Button variant="primary" size="sm" onClick={onSaveStretches} disabled={loading}>
              Save stretches
            </Button>
          </>
        )}
      </div>

      {stretchCanSave && (
        <MutedText className={stretchPanelStyles.hint}>
          Unsaved stretch changes. Save to keep, or reset to discard.
        </MutedText>
      )}

      {settingsOpen && (
        <StretchThresholdSettings
          draft={draft}
          onDraftChange={setDraft}
          onPreview={onPreviewThresholds}
          defaultThresholds={defaultThresholds}
          loading={loading}
        />
      )}

      {!stretches.length ? (
        <MutedText>
          {reason ?? "No stretches yet. Elevation data is required to split this segment."}
        </MutedText>
      ) : (
        <div className={stretchPanelStyles.splitLayout}>
          <div className={stretchPanelStyles.stretchListPane}>
            <table className={stretchPanelStyles.stretchTable}>
              <thead>
                <tr>
                  <th className={stretchPanelStyles.stretchTh}>#</th>
                  <th className={stretchPanelStyles.stretchTh}>Kind</th>
                  <th className={stretchPanelStyles.stretchTh}>Len</th>
                  <th className={stretchPanelStyles.stretchTh}>Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className={stretchPanelStyles.fullSegmentRow(!stretchSelected)}
                  onClick={handleClearSelection}
                >
                  <td className={stretchPanelStyles.stretchTd} colSpan={2}>
                    Full segment
                  </td>
                  <td className={stretchPanelStyles.stretchTd}>
                    {fullSegmentBaseline
                      ? formatDistance(fullSegmentBaseline.distance_m)
                      : "—"}
                  </td>
                  <td className={stretchPanelStyles.stretchTd}>
                    {fullSegmentBaseline && fullSegmentBaseline.distance_m > 0
                      ? `${(
                          ((fullSegmentBaseline.elevation_delta_m ?? 0) /
                            fullSegmentBaseline.distance_m) *
                          100
                        ).toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
                {stretches.map((stretch) => (
                  <tr
                    key={stretch.index}
                    className={stretchPanelStyles.stretchRow(stretch.index === selectedStretchIndex)}
                    onClick={() => onSelectStretch?.(stretch)}
                  >
                    <td className={stretchPanelStyles.stretchTd}>{stretch.index}</td>
                    <td className={stretchPanelStyles.stretchTd}>
                      <span className={stretchPanelStyles.kindBadge(stretch.kind)}>
                        {stretchKindLabel(stretch.kind)}
                      </span>
                    </td>
                    <td className={stretchPanelStyles.stretchTd}>
                      {formatDistance(stretch.length_m)}
                    </td>
                    <td className={stretchPanelStyles.stretchTd}>
                      {stretch.avg_grade_pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={stretchPanelStyles.comparisonPane}>
            <div className={stretchPanelStyles.comparisonHeader}>
              <h3 className={stretchPanelStyles.comparisonTitle}>
                {stretchSelected && selectedStretch
                  ? `Stretch ${selectedStretch.index} · ${stretchKindLabel(selectedStretch.kind)} · ${formatDistance(selectedStretch.length_m)}`
                  : fullSegmentBaseline
                    ? `Full segment · ${formatDistance(fullSegmentBaseline.distance_m)} · all included passes`
                    : "Full segment · all included passes"}
              </h3>
              {stretchSelected && (
                <Button
                  size="sm"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClearSelection();
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            <StretchComparisonTable
              rows={comparisonRows}
              baseline={comparisonBaseline}
              stretchSourcePassId={stretchSourcePassId}
              canExcludePasses={includedPassCount > 1}
              onExcludePass={onExcludeIncludedPass}
              loading={comparisonLoading}
              emptyMessage={
                stretchSelected
                  ? "No included passes with data for this stretch."
                  : "No included passes to compare."
              }
            />
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
};