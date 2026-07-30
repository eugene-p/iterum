import { useMemo, useState, type ReactNode } from "react";
import { CollapsibleSection, MutedText } from "../../ui";
import {
  comparisonBaselineFromStretches,
  comparisonBaselineFromStretch,
  stretchKindLabel,
  type StretchPassMetrics,
  formatStretchLabel,
} from "../../../stretchUtils";
import type { SegmentPass, Stretch, StretchState } from "../../../types";
import { stretchDisplayNumber } from "../../../lib/stretchEdit";
import { formatDistance } from "../../../utils";
import { stretchPanelStyles } from "./StretchPanel.styles";
import { StretchComparisonTable } from "./StretchComparisonTable";

type StretchPanelProps = {
  stretches: Stretch[];
  fullPassMetrics?: StretchPassMetrics[];
  reason?: string | null;
  stretchState?: StretchState;
  selectedStretchIndex?: number | null;
  selectedStretch?: Stretch | null;
  stretchPassMetrics?: StretchPassMetrics[];
  stretchSourcePassId?: number | null;
  onSelectStretch?: (stretch: Stretch) => void;
  onClearStretchSelection?: () => void;
  onExcludeIncludedPass?: (pass: SegmentPass) => void;
  includedPassCount?: number;
  loading?: boolean;
  /** Movie-style boundary editor (merge / split / resize / convert). */
  stripEditor?: ReactNode;
  /** When true, threshold controls are locked (geometry edit dirty). */
  geometryDirty?: boolean;
  /** Route workspace owns selection; this panel only presents the selected comparison. */
  selectionMode?: "inline" | "map";
};

export const StretchPanel = ({
  stretches,
  fullPassMetrics = [],
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
  loading = false,
  stripEditor = null,
  geometryDirty = false,
  selectionMode = "inline",
}: StretchPanelProps) => {
  const [expanded, setExpanded] = useState(true);
  const stretchSelected = selectedStretchIndex != null;

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
      title={
        stretchSelected && selectedStretch
          ? formatStretchLabel(selectedStretch)
          : "Full segment comparison"
      }
      headingLevel="h2"
      expanded={expanded}
      onToggle={() => setExpanded((open) => !open)}
      meta={
        <>
          {stretchSelected && selectedStretch
            ? `Stretch ${stretchDisplayNumber(selectedStretch.index)} of ${stretches.length} · ${formatDistance(selectedStretch.length_m)} ↔ · ${formatDistance(selectedStretch.elevation_delta_m)} ↕`
            : `${stretches.length ? `${stretches.length} stretches` : "No stretches"} · full segment`}
          {stretchState === "preview" ? " · preview" : ""}
        </>
      }
    >
      {stripEditor}

      {!stretches.length ? (
        <MutedText>
          {reason ?? "No stretches yet. Elevation data is required to suggest them from this route."}
        </MutedText>
      ) : (
        <div className={selectionMode === "inline" ? stretchPanelStyles.splitLayout : undefined}>
          {selectionMode === "inline" ? (
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
                  className={stretchPanelStyles.fullSegmentRow(!stretchSelected, geometryDirty)}
                  onClick={geometryDirty ? undefined : handleClearSelection}
                  aria-disabled={geometryDirty || undefined}
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
                {stretches.map((stretch, arrayIndex) => (
                  <tr
                    key={stretch.index}
                    className={stretchPanelStyles.stretchRow(
                      arrayIndex === selectedStretchIndex ||
                      stretch.index === selectedStretchIndex,
                      geometryDirty,
                    )}
                    onClick={
                      geometryDirty ? undefined : () => onSelectStretch?.(stretch)
                    }
                    aria-disabled={geometryDirty || undefined}
                  >
                    <td className={stretchPanelStyles.stretchTd}>
                      {stretchDisplayNumber(arrayIndex)}
                    </td>
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
          ) : null}

          <div className={stretchPanelStyles.comparisonPane}>
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
