import {
  formatExplorerPassMetrics,
  metricsAtIndex,
  type ExplorerPassSlice,
} from "../../../routeExplorerUtils";
import type { StretchPointContext } from "../../../stretchUtils";
import { PassDateProfileRow } from "../../profiles/PassDateProfileRow";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

type PassMetricsRowProps = {
  slice: ExplorerPassSlice;
  index: number;
  color: string;
  positionColor?: string | null;
  stretchContext?: StretchPointContext | null;
};

export const PassMetricsRow = ({
  slice,
  index,
  color,
  positionColor = null,
  stretchContext = null,
}: PassMetricsRowProps) => {
  const passLabel = slice.pass.pass_number > 1 ? ` · pass ${slice.pass.pass_number}` : "";

  return (
    <div
      className={`${routeExplorerStyles.passRow}${positionColor ? ` ${routeExplorerStyles.passRowWithPosition}` : ""}`}
      style={positionColor ? { borderLeftColor: positionColor } : undefined}
    >
      <span
        className={routeExplorerStyles.passDot}
        style={{ background: color }}
        title="Activity color (map)"
      />
      <div className={routeExplorerStyles.passMain}>
        <div className={routeExplorerStyles.passTitleRow}>
          <div className={routeExplorerStyles.passTitle}>
            {slice.pass.activity_name}
            {passLabel}
          </div>
          {positionColor && (
            <span
              className={routeExplorerStyles.positionSwatch}
              style={{ background: positionColor }}
              title="Ahead ranking"
            />
          )}
        </div>
        <PassDateProfileRow
          pass={slice.pass}
          className={routeExplorerStyles.passDateTime}
          started_at={slice.pass.started_at}
          name={slice.pass.activity_name}
          source_filename={slice.pass.source_filename}
        />
        <div className={routeExplorerStyles.passMetrics}>
          {formatExplorerPassMetrics(
            metricsAtIndex(slice.points, index, slice.durationSec),
            stretchContext,
          )}
        </div>
      </div>
    </div>
  );
};