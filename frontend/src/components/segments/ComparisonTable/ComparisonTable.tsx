import { bestValue } from "../../../lib/bestValue";
import type { SegmentPass } from "../../../types";
import {
  formatDistance,
  formatDuration,
  formatHr,
  formatPaceFromSpeed,
  formatSpeed,
} from "../../../utils";
import { PassDateProfileRow } from "../../profiles/PassDateProfileRow";
import { Badge, Button, Switch } from "../../ui";
import { comparisonTableStyles } from "./ComparisonTable.styles";

type ComparisonTableProps = {
  passes: SegmentPass[];
  includedPassIdSet?: ReadonlySet<number>;
  stretchSourceActivityId?: number | null;
  stretchSourcePassId?: number | null;
  onSetPassIncluded?: (pass: SegmentPass, included: boolean) => void;
  onSetStretchSource?: (pass: SegmentPass) => void;
  /** When passes is empty, override the default empty message. */
  emptyMessage?: string;
};

export const ComparisonTable = ({
  passes,
  includedPassIdSet,
  stretchSourceActivityId,
  stretchSourcePassId,
  onSetPassIncluded,
  onSetStretchSource,
  emptyMessage,
}: ComparisonTableProps) => {
  const includedPasses = includedPassIdSet
    ? passes.filter((pass) => pass.matched && includedPassIdSet.has(pass.id))
    : passes.filter((pass) => pass.matched);
  const bestDuration = bestValue(
    includedPasses.map((p) => p.duration_sec),
    true,
  );
  const bestSpeed = bestValue(includedPasses.map((p) => p.avg_speed_kmh));
  const bestHr = bestValue(
    includedPasses.map((p) => p.avg_hr),
    true,
  );

  if (!passes.length) {
    return (
      <p className={comparisonTableStyles.empty}>
        {emptyMessage ??
          "No included passes to show. Include at least one matched pass above."}
      </p>
    );
  }

  return (
    <table className={comparisonTableStyles.table}>
      <thead>
        <tr>
          {onSetPassIncluded && <th className={comparisonTableStyles.th}>Include</th>}
          <th className={comparisonTableStyles.th}>Activity</th>
          <th className={comparisonTableStyles.th}>Pass</th>
          <th className={comparisonTableStyles.th}>Match</th>
          <th className={comparisonTableStyles.th}>Time</th>
          <th className={comparisonTableStyles.th}>Distance</th>
          <th className={comparisonTableStyles.th}>Avg speed</th>
          <th className={comparisonTableStyles.th}>Pace</th>
          <th className={comparisonTableStyles.th}>Avg HR</th>
          <th className={comparisonTableStyles.th}>Max HR</th>
          <th className={comparisonTableStyles.th}>Elev gain</th>
          {onSetStretchSource && <th className={comparisonTableStyles.th}>Stretches</th>}
        </tr>
      </thead>
      <tbody>
        {passes.map((pass) => {
          const included =
            pass.matched && (!includedPassIdSet || includedPassIdSet.has(pass.id));
          return (
          <tr
            key={pass.id}
            className={comparisonTableStyles.row(
              pass.id === stretchSourcePassId,
              !pass.matched || !included,
            )}
          >
            {onSetPassIncluded && (
              <td
                className={comparisonTableStyles.td}
                onClick={(event) => event.stopPropagation()}
              >
                {pass.matched ? (
                  <Switch
                    size="sm"
                    checked={included}
                    aria-label={`Include ${pass.activity_name}`}
                    onChange={(e) => onSetPassIncluded(pass, e.target.checked)}
                  />
                ) : (
                  "—"
                )}
              </td>
            )}
            <td className={comparisonTableStyles.td}>
              <div className={comparisonTableStyles.cellName}>
                {pass.activity_name}
                {stretchSourceActivityId != null &&
                  pass.activity_id === stretchSourceActivityId && (
                    <Badge>Stretch source</Badge>
                  )}
              </div>
              <PassDateProfileRow
                pass={pass}
                className="w-full"
                started_at={pass.started_at}
                name={pass.activity_name}
                source_filename={pass.source_filename}
              />
            </td>
            <td className={comparisonTableStyles.td}>{pass.pass_number}</td>
            <td className={comparisonTableStyles.td}>{Math.round(pass.match_score * 100)}%</td>
            <td
              className={comparisonTableStyles.best(
                included && pass.duration_sec === bestDuration,
              )}
            >
              {formatDuration(pass.duration_sec)}
            </td>
            <td className={comparisonTableStyles.td}>{formatDistance(pass.distance_m)}</td>
            <td
              className={comparisonTableStyles.best(
                included && pass.avg_speed_kmh === bestSpeed,
              )}
            >
              {formatSpeed(pass.avg_speed_kmh)}
            </td>
            <td className={comparisonTableStyles.td}>{formatPaceFromSpeed(pass.avg_speed_kmh)}</td>
            <td
              className={comparisonTableStyles.best(included && pass.avg_hr === bestHr)}
            >
              {formatHr(pass.avg_hr)}
            </td>
            <td className={comparisonTableStyles.td}>{formatHr(pass.max_hr)}</td>
            <td className={comparisonTableStyles.td}>
              {pass.elevation_gain_m != null ? `${Math.round(pass.elevation_gain_m)} m` : "—"}
            </td>
            {onSetStretchSource && (
              <td
                className={comparisonTableStyles.td}
                onClick={(event) => event.stopPropagation()}
              >
                {pass.matched ? (
                  <Button
                    size="sm"
                    variant={stretchSourceActivityId === pass.activity_id ? "primary" : "default"}
                    onClick={() => onSetStretchSource(pass)}
                  >
                    {stretchSourceActivityId === pass.activity_id ? "Source" : "Use"}
                  </Button>
                ) : (
                  "—"
                )}
              </td>
            )}
          </tr>
        );
        })}
      </tbody>
    </table>
  );
};