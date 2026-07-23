import { useMemo } from "react";
import { cn } from "../../../lib/cn";
import {
  computeHrZoneTimesForSeries,
  HR_ZONES,
  type HrZoneTimeSeries,
} from "../../../lib/hrZones";
import { formatDuration } from "../../../utils";
import { activityTrackChartStyles, type ActivityTrackChartSize } from "./ActivityTrackChart.styles";

type HrZoneTimeSummaryProps = {
  series: HrZoneTimeSeries[];
  maxHr: number;
  size?: ActivityTrackChartSize;
};

export const HrZoneTimeSummary = ({ series, maxHr, size = "compact" }: HrZoneTimeSummaryProps) => {
  const isLarge = size === "large";
  const zoneTimesBySeries = useMemo(
    () => computeHrZoneTimesForSeries(series, maxHr),
    [maxHr, series],
  );

  const activeZones = useMemo(
    () =>
      HR_ZONES.filter((zone) =>
        zoneTimesBySeries.some((entry) => {
          const zoneTime = entry.zones.find((item) => item.id === zone.id);
          return (zoneTime?.seconds ?? 0) > 0;
        }),
      ),
    [zoneTimesBySeries],
  );

  if (!zoneTimesBySeries.length || !activeZones.length) return null;

  const multiSeries = zoneTimesBySeries.length > 1;

  return (
    <div
      className={cn(
        activityTrackChartStyles.zoneTimeSummary,
        isLarge ? activityTrackChartStyles.zoneTimeSummaryLarge : activityTrackChartStyles.zoneTimeSummaryCompact,
      )}
    >
      {activeZones.map((zone) => (
        <span key={zone.id} className={activityTrackChartStyles.zoneTimeItem}>
          <span
            className={activityTrackChartStyles.zoneTimeSwatch}
            style={{ backgroundColor: zone.color }}
            aria-hidden
          />
          {zone.label}
          {zoneTimesBySeries.map((entry, index) => {
            const zoneTime = entry.zones.find((item) => item.id === zone.id);
            const value = zoneTime?.seconds ?? 0;
            if (value <= 0) return null;
            return (
              <span
                key={`${zone.id}-${entry.seriesLabel ?? index}`}
                className={activityTrackChartStyles.zoneTimeValue}
                title={entry.seriesLabel}
              >
                {multiSeries && entry.seriesColor ? (
                  <span
                    className={activityTrackChartStyles.zoneTimeSeriesDot}
                    style={{ backgroundColor: entry.seriesColor }}
                    aria-hidden
                  />
                ) : null}
                {formatDuration(value)}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};