import { MutedText } from "../../ui";
import { formatDistanceShort, hasSpeed, metricsAtIndex } from "../../../routeExplorerUtils";
import { formatDuration, formatHr, formatPaceFromSpeed, formatSpeed } from "../../../utils";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

type MetricsGridProps = {
  metrics: ReturnType<typeof metricsAtIndex>;
};

export const MetricsGrid = ({ metrics }: MetricsGridProps) => {
  if (!metrics) {
    return <MutedText>No data at this position.</MutedText>;
  }

  return (
    <div className={routeExplorerStyles.metricsGrid}>
      {metrics.elapsedSec != null && (
        <div className={routeExplorerStyles.metric}>
          <span className={routeExplorerStyles.metricLabel}>Elapsed</span>
          <span className={routeExplorerStyles.metricValue}>{formatDuration(metrics.elapsedSec)}</span>
        </div>
      )}
      <div className={routeExplorerStyles.metric}>
        <span className={routeExplorerStyles.metricLabel}>Distance</span>
        <span className={routeExplorerStyles.metricValue}>{formatDistanceShort(metrics.distanceM)}</span>
      </div>
      <div className={routeExplorerStyles.metric}>
        <span className={routeExplorerStyles.metricLabel}>HR</span>
        <span className={routeExplorerStyles.metricValue}>{formatHr(metrics.point.heart_rate)}</span>
      </div>
      {hasSpeed(metrics.speedKmh) && (
        <>
          <div className={routeExplorerStyles.metric}>
            <span className={routeExplorerStyles.metricLabel}>Speed</span>
            <span className={routeExplorerStyles.metricValue}>{formatSpeed(metrics.speedKmh)}</span>
          </div>
          <div className={routeExplorerStyles.metric}>
            <span className={routeExplorerStyles.metricLabel}>Pace</span>
            <span className={routeExplorerStyles.metricValue}>
              {formatPaceFromSpeed(metrics.speedKmh)}
            </span>
          </div>
        </>
      )}
      <div className={routeExplorerStyles.metric}>
        <span className={routeExplorerStyles.metricLabel}>Elevation</span>
        <span className={routeExplorerStyles.metricValue}>
          {metrics.point.elevation_m != null ? `${Math.round(metrics.point.elevation_m)} m` : "—"}
        </span>
      </div>
    </div>
  );
};