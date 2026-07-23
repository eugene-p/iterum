import { formatExplorerPassMetrics, type metricsAtIndex } from "../../../routeExplorerUtils";
import type { StretchPointContext } from "../../../stretchUtils";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

type CompareReferenceCardProps = {
  metrics: NonNullable<ReturnType<typeof metricsAtIndex>>;
  stretchContext?: StretchPointContext | null;
  positionColor?: string | null;
};

export const CompareReferenceCard = ({
  metrics,
  stretchContext = null,
  positionColor = null,
}: CompareReferenceCardProps) => (
  <div
    className={`${routeExplorerStyles.passRow}${
      positionColor ? ` ${routeExplorerStyles.passRowWithPosition}` : ""
    }`}
    style={positionColor ? { borderLeftColor: positionColor } : undefined}
  >
    <div className={routeExplorerStyles.passMain}>
      <div className={routeExplorerStyles.passTitleRow}>
        <div className={routeExplorerStyles.passTitle}>Reference</div>
        {positionColor ? (
          <span
            className={routeExplorerStyles.positionSwatch}
            style={{ background: positionColor }}
            title="Stretch position"
          />
        ) : null}
      </div>
      <div className={routeExplorerStyles.passMetrics}>
        {formatExplorerPassMetrics(metrics, stretchContext)}
      </div>
    </div>
  </div>
);
