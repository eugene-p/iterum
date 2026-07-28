import { bestValue } from "../../../lib/bestValue";
import {
  type ComparisonBaseline,
  formatElevationDelta,
  speedKmhFromDistance,
} from "../../../stretchUtils";
import type { SegmentPass } from "../../../types";
import {
  formatDistance,
  formatDuration,
  formatHr,
  formatPaceFromSpeed,
  formatSpeed,
} from "../../../utils";
import { ActivityDateTime } from "../../activities/ActivityDateTime";
import { Button, MutedText } from "../../ui";
import { stretchPanelStyles } from "./StretchPanel.styles";

export type StretchComparisonRow = {
  pass: SegmentPass;
  distance_m: number;
  duration_sec: number | null;
  avg_speed_kmh: number | null;
  avg_hr: number | null;
  elevation_gain_m: number | null;
};

type StretchComparisonTableProps = {
  rows: StretchComparisonRow[];
  baseline?: ComparisonBaseline | null;
  stretchSourcePassId?: number | null;
  canExcludePasses?: boolean;
  onExcludePass?: (pass: SegmentPass) => void;
  onSetStretchSource?: (activityId: number) => void;
  loading?: boolean;
  emptyMessage?: string;
};

const bestCellStyle = (isBest: boolean) =>
  isBest ? { fontWeight: 600, color: "var(--color-success, #7dffb0)" } : undefined;

export const StretchComparisonTable = ({
  rows,
  baseline,
  stretchSourcePassId,
  canExcludePasses = false,
  onExcludePass,
  onSetStretchSource,
  loading = false,
  emptyMessage = "No included passes to compare.",
}: StretchComparisonTableProps) => {
  const rowSpeed = (row: StretchComparisonRow) =>
    baseline
      ? speedKmhFromDistance(row.duration_sec, baseline.distance_m)
      : row.avg_speed_kmh;

  const bestDuration = bestValue(
    rows.map((row) => row.duration_sec),
    true,
  );
  const bestSpeed = bestValue(rows.map(rowSpeed));
  const bestHr = bestValue(
    rows.map((row) => row.avg_hr),
    true,
  );

  if (loading) {
    return <MutedText>Loading activity data…</MutedText>;
  }

  if (!rows.length) {
    return <MutedText>{emptyMessage}</MutedText>;
  }

  return (
    <table className={stretchPanelStyles.comparisonTable}>
      <thead>
        <tr>
          {onExcludePass && <th className={stretchPanelStyles.comparisonTh} aria-label="Exclude" />}
          <th className={stretchPanelStyles.comparisonTh}>Activity</th>
          <th className={stretchPanelStyles.comparisonTh}>Pass</th>
          <th className={stretchPanelStyles.comparisonTh}>Time</th>
          <th className={stretchPanelStyles.comparisonTh}>Distance</th>
          <th className={stretchPanelStyles.comparisonTh}>Speed</th>
          <th className={stretchPanelStyles.comparisonTh}>Pace</th>
          <th className={stretchPanelStyles.comparisonTh}>HR</th>
          <th className={stretchPanelStyles.comparisonTh}>Elev</th>
          {onSetStretchSource && (
            <th className={stretchPanelStyles.comparisonTh}>Source</th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isSource = row.pass.id === stretchSourcePassId;
          return (
          <tr
            key={row.pass.id}
            className={stretchPanelStyles.comparisonRow(isSource)}
          >
            {onExcludePass && (
              <td className={stretchPanelStyles.comparisonTd}>
                <button
                  type="button"
                  className={stretchPanelStyles.excludeButton}
                  aria-label={`Exclude ${row.pass.activity_name} pass ${row.pass.pass_number} from comparison`}
                  title="Exclude from comparison"
                  disabled={!canExcludePasses}
                  onClick={(event) => {
                    event.stopPropagation();
                    onExcludePass(row.pass);
                  }}
                >
                  ×
                </button>
              </td>
            )}
            <td className={stretchPanelStyles.comparisonTd}>
              <div className={stretchPanelStyles.comparisonActivityName}>{row.pass.activity_name}</div>
              <ActivityDateTime
                started_at={row.pass.started_at}
                name={row.pass.activity_name}
                source_filename={row.pass.source_filename}
              />
            </td>
            <td className={stretchPanelStyles.comparisonTd}>{row.pass.pass_number}</td>
            <td
              className={stretchPanelStyles.comparisonTd}
              style={bestCellStyle(row.duration_sec === bestDuration)}
            >
              {formatDuration(row.duration_sec)}
            </td>
            <td className={stretchPanelStyles.comparisonTd}>
              {baseline
                ? formatDistance(baseline.distance_m)
                : formatDistance(row.distance_m)}
            </td>
            <td
              className={stretchPanelStyles.comparisonTd}
              style={bestCellStyle(rowSpeed(row) === bestSpeed)}
            >
              {formatSpeed(rowSpeed(row))}
            </td>
            <td className={stretchPanelStyles.comparisonTd}>
              {formatPaceFromSpeed(rowSpeed(row))}
            </td>
            <td
              className={stretchPanelStyles.comparisonTd}
              style={bestCellStyle(row.avg_hr === bestHr)}
            >
              {formatHr(row.avg_hr)}
            </td>
            <td className={stretchPanelStyles.comparisonTd}>
              {baseline?.elevation_delta_m != null
                ? formatElevationDelta(baseline.elevation_delta_m)
                : row.elevation_gain_m != null
                  ? `${Math.round(row.elevation_gain_m)} m`
                  : "—"}
            </td>
            {onSetStretchSource && (
              <td className={stretchPanelStyles.comparisonTd}>
                <Button
                  size="sm"
                  variant={isSource ? "primary" : "default"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSetStretchSource(row.pass.activity_id);
                  }}
                >
                  {isSource ? "Source" : "Use"}
                </Button>
              </td>
            )}
          </tr>
          );
        })}
      </tbody>
    </table>
  );
};