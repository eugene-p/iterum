import { useMemo, type ReactNode } from "react";
import { cn } from "../../../lib/cn";
import type { TrackPoint } from "../../../types";
import { formatHr } from "../../../utils";
import { computeHrZoneBands } from "../../../lib/hrZones";
import {
  buildActivityTrackSeries,
  CHART_BOTTOM,
  CHART_TOP,
  computeElevationGridLines,
  elevToChartY,
  elevToTopPercent,
  hrToChartY,
  hrToTopPercent,
  sampleAtFraction,
  seriesToSvgPaths,
} from "./activityTrackChartUtils";
import { ChartGridLines } from "./ChartGridLines";
import { HrZoneBands } from "./HrZoneBands";
import { HrZoneTimeSummary } from "./HrZoneTimeSummary";
import {
  activityTrackChartStyles,
  type ActivityTrackChartSize,
} from "./ActivityTrackChart.styles";
import { clampFraction, useTrackChartInteraction } from "./useTrackChartInteraction";

export type ActivityTrackChartViewProps = {
  points: TrackPoint[];
  maxHr?: number | null;
  durationSec?: number | null;
  size?: ActivityTrackChartSize;
  positionFraction?: number;
  onPositionFractionChange?: (fraction: number) => void;
  showExpandHint?: boolean;
  showZoneSummary?: boolean;
  /** Rendered inside the chart plot (e.g. separate Expand control). */
  chartOverlay?: ReactNode;
};

export const ActivityTrackChartView = ({
  points,
  maxHr,
  durationSec,
  size = "compact",
  positionFraction,
  onPositionFractionChange,
  showExpandHint = false,
  showZoneSummary = true,
  chartOverlay,
}: ActivityTrackChartViewProps) => {
  const isLarge = size === "large";
  const series = useMemo(() => buildActivityTrackSeries(points), [points]);
  const paths = useMemo(() => (series ? seriesToSvgPaths(series) : null), [series]);
  const elevationGridLines = useMemo(
    () =>
      series?.hasElevation ? computeElevationGridLines(series.elevMin, series.elevMax) : [],
    [series],
  );
  const elevScale = useMemo(
    () => (series ? { elevMin: series.elevMin, elevMax: series.elevMax } : null),
    [series],
  );
  const zoneBands = useMemo(() => {
    if (!series || maxHr == null) return [];
    return computeHrZoneBands(maxHr, series, hrToChartY);
  }, [maxHr, series]);
  const interactive = onPositionFractionChange != null;
  const hoverProbe = isLarge && !interactive;
  const { hover, wrapHandlers, svgHandlers } = useTrackChartInteraction({
    interactive,
    hoverProbe,
    onPositionFractionChange,
  });
  const cursorX = positionFraction == null ? null : clampFraction(positionFraction) * 100;
  const zoneTimeSeries = useMemo(
    () => (maxHr != null ? [{ points, durationSec }] : []),
    [durationSec, maxHr, points],
  );
  const hoverSample = useMemo(
    () => (hover && series ? sampleAtFraction(series, hover.fraction) : null),
    [hover, series],
  );
  const hoverCursorX = hover ? hover.fraction * 100 : null;
  const hoverHrY =
    hoverSample?.hr != null && series ? hrToChartY(hoverSample.hr, series) : null;

  if (!series || !paths?.hrLine) return null;

  const hoverTooltipLines = [
    hoverSample?.hr != null ? formatHr(hoverSample.hr) : null,
    hoverSample?.elev != null ? `${Math.round(hoverSample.elev)} m` : null,
  ].filter(Boolean);

  const axisLabelSize = isLarge
    ? activityTrackChartStyles.axisLabelLarge
    : activityTrackChartStyles.axisLabelCompact;

  return (
    <div className={cn(activityTrackChartStyles.root, isLarge && activityTrackChartStyles.rootLarge)}>
      <div
        className={cn(
          activityTrackChartStyles.chartWrap,
          isLarge
            ? activityTrackChartStyles.chartWrapLarge
            : activityTrackChartStyles.chartWrapCompact,
          showExpandHint && activityTrackChartStyles.chartWrapExpandableHover,
          interactive && activityTrackChartStyles.chartWrapInteractive,
          hoverProbe && activityTrackChartStyles.chartWrapHoverProbe,
        )}
        {...wrapHandlers}
      >
        <span
          className={cn(
            activityTrackChartStyles.axisLabel,
            axisLabelSize,
            activityTrackChartStyles.axisLeft,
          )}
        >
          {formatHr(series.hrMax)}
        </span>
        <span
          className={cn(
            activityTrackChartStyles.axisLabel,
            axisLabelSize,
            activityTrackChartStyles.axisLeftBottom,
          )}
        >
          {formatHr(series.hrMin)}
        </span>
        {series.hasElevation ? (
          <>
            <span
              className={cn(
                activityTrackChartStyles.axisLabel,
                axisLabelSize,
                activityTrackChartStyles.axisRight,
              )}
            >
              {Math.round(series.elevMax)} m
            </span>
            <span
              className={cn(
                activityTrackChartStyles.axisLabel,
                axisLabelSize,
                activityTrackChartStyles.axisRightBottom,
              )}
            >
              {Math.round(series.elevMin)} m
            </span>
          </>
        ) : null}
        <svg
          className={cn(
            activityTrackChartStyles.svg,
            interactive && activityTrackChartStyles.svgInteractive,
          )}
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          aria-hidden={!interactive}
          aria-label={interactive ? "Scrub position along activity" : undefined}
          {...svgHandlers}
        >
          <HrZoneBands bands={zoneBands} />
          {elevScale ? (
            <ChartGridLines
              gridLines={elevationGridLines}
              valueToChartY={(elev) => elevToChartY(elev, elevScale)}
            />
          ) : null}
          {paths.elevationArea ? (
            <path d={paths.elevationArea} fill="#4a5568" fillOpacity={0.45} />
          ) : null}
          {paths.elevationLine ? (
            <path
              d={paths.elevationLine}
              fill="none"
              stroke="#6b7a8f"
              strokeOpacity={0.55}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            d={paths.hrLine}
            fill="none"
            stroke="#e85d6a"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {cursorX != null ? (
            <line
              x1={cursorX}
              y1={CHART_TOP}
              x2={cursorX}
              y2={CHART_BOTTOM}
              stroke="#e8edf5"
              strokeOpacity={0.92}
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {hoverCursorX != null ? (
            <>
              <line
                x1={hoverCursorX}
                y1={CHART_TOP}
                x2={hoverCursorX}
                y2={CHART_BOTTOM}
                stroke="#e8edf5"
                strokeOpacity={0.75}
                strokeWidth={1}
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
              />
              {hoverHrY != null ? (
                <line
                  x1={0}
                  y1={hoverHrY}
                  x2={100}
                  y2={hoverHrY}
                  stroke="#e85d6a"
                  strokeOpacity={0.45}
                  strokeWidth={0.8}
                  strokeDasharray="2 2"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
            </>
          ) : null}
        </svg>
        {hover && hoverTooltipLines.length > 0 ? (
          <div
            className={cn(
              activityTrackChartStyles.hoverTooltip,
              isLarge && activityTrackChartStyles.hoverTooltipLarge,
            )}
            style={{
              left: hover.x + (hover.fraction > 0.72 ? -12 : 12),
              top: Math.max(8, hover.y - 28),
              transform: hover.fraction > 0.72 ? "translateX(-100%)" : undefined,
            }}
          >
            {hoverTooltipLines.join(" · ")}
          </div>
        ) : null}
        {showExpandHint ? (
          <span className={activityTrackChartStyles.expandHint}>Expand</span>
        ) : null}
        {chartOverlay}
        {elevScale ? (
          <div className={activityTrackChartStyles.overlayLabels}>
            {elevationGridLines.map((elev) => (
              <span
                key={`grid-label-${elev}`}
                className={cn(
                  activityTrackChartStyles.gridLabel,
                  isLarge
                    ? activityTrackChartStyles.gridLabelLarge
                    : activityTrackChartStyles.gridLabelCompact,
                )}
                style={{ top: `${elevToTopPercent(elev, elevScale)}%` }}
              >
                {elev} m
              </span>
            ))}
          </div>
        ) : null}
        {hoverSample?.hr != null && hover ? (
          <div className={activityTrackChartStyles.hoverOverlay} aria-hidden>
            <span
              className={activityTrackChartStyles.hoverDot}
              style={{
                left: `${hover.fraction * 100}%`,
                top: `${hrToTopPercent(hoverSample.hr, series)}%`,
                width: 8,
                height: 8,
                minWidth: 8,
                minHeight: 8,
                maxWidth: 8,
                maxHeight: 8,
              }}
            />
          </div>
        ) : null}
      </div>

      <div className={activityTrackChartStyles.legend}>
        <span
          className={cn(
            activityTrackChartStyles.legendItem,
            isLarge && activityTrackChartStyles.legendItemLarge,
          )}
        >
          <span className={activityTrackChartStyles.legendHr} aria-hidden />
          Heart rate
        </span>
        {series.hasElevation ? (
          <span
            className={cn(
              activityTrackChartStyles.legendItem,
              isLarge && activityTrackChartStyles.legendItemLarge,
            )}
          >
            <span className={activityTrackChartStyles.legendElev} aria-hidden />
            Elevation
          </span>
        ) : null}
      </div>

      {showZoneSummary && maxHr != null ? (
        <HrZoneTimeSummary series={zoneTimeSeries} maxHr={maxHr} size={size} />
      ) : null}
    </div>
  );
};
