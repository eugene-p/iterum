import { useMemo, type ReactNode } from "react";
import { cn } from "../../../../lib/cn";
import { formatHr } from "../../../../utils";
import {
  activityTrackChartStyles,
  type ActivityTrackChartSize,
} from "../../../activities/ActivityTrackChart/ActivityTrackChart.styles";
import {
  CHART_BOTTOM,
  CHART_TOP,
  CHART_VIEW_HEIGHT,
  hrToChartY,
} from "../../../activities/ActivityTrackChart/activityTrackChartUtils";
import {
  clampFraction,
  useTrackChartInteraction,
} from "../../../activities/ActivityTrackChart/useTrackChartInteraction";
import { HrZoneBands } from "../../../activities/ActivityTrackChart/HrZoneBands";
import { ChartGridLines } from "../../../activities/ActivityTrackChart/ChartGridLines";
import { computeHrZoneBands } from "../../../../lib/hrZones";
import {
  buildPassCompareTrackChartData,
  passCompareElevScale,
  passCompareElevationGridLines,
  passCompareElevToChartY,
  passCompareElevToTopPercent,
  passCompareHrScale,
  passCompareHrToTopPercent,
  samplePassesAtFraction,
  type PassCompareChartMode,
  type PassCompareTrackPass,
} from "./passCompareTrackChartUtils";
import { PassComparePassLegend } from "./PassComparePassLegend";
import { passCompareTrackChartStyles } from "./passCompareTrackChartStyles";
import type { TrackPoint } from "../../../../types";

const chartYToTopPercent = (y: number) => (y / CHART_VIEW_HEIGHT) * 100;

export type PassCompareTrackChartViewProps = {
  passes: PassCompareTrackPass[];
  elevationPoints?: TrackPoint[];
  mode: PassCompareChartMode;
  maxTimeSec?: number;
  maxHr?: number | null;
  size?: ActivityTrackChartSize;
  positionFraction?: number;
  onPositionFractionChange?: (fraction: number) => void;
  showExpandHint?: boolean;
  /** Rendered inside the chart plot (e.g. separate Expand control). */
  chartOverlay?: ReactNode;
};

export const PassCompareTrackChartView = ({
  passes,
  elevationPoints = [],
  mode,
  maxTimeSec = 0,
  maxHr = null,
  size = "compact",
  positionFraction,
  onPositionFractionChange,
  showExpandHint = false,
  chartOverlay,
}: PassCompareTrackChartViewProps) => {
  const isLarge = size === "large";
  const chartData = useMemo(
    () =>
      buildPassCompareTrackChartData(passes, {
        mode,
        elevationPoints,
        maxTimeSec,
        zoneMaxHr: maxHr,
      }),
    [passes, mode, elevationPoints, maxTimeSec, maxHr],
  );
  const elevationGridLines = useMemo(
    () => (chartData ? passCompareElevationGridLines(chartData) : []),
    [chartData],
  );
  const elevScale = useMemo(
    () => (chartData?.hasElevation ? passCompareElevScale(chartData) : null),
    [chartData],
  );
  const zoneBands = useMemo(() => {
    if (!chartData || chartData.zoneMaxHr == null) return [];
    return computeHrZoneBands(chartData.zoneMaxHr, passCompareHrScale(chartData), hrToChartY);
  }, [chartData]);
  const interactive = onPositionFractionChange != null;
  const hoverProbe = isLarge && !interactive;
  const { hover, wrapHandlers, svgHandlers } = useTrackChartInteraction({
    interactive,
    hoverProbe,
    onPositionFractionChange,
  });
  const cursorX = positionFraction == null ? null : clampFraction(positionFraction) * 100;
  const hoverSamples = useMemo(
    () =>
      hover && chartData
        ? samplePassesAtFraction(passes, mode, hover.fraction, maxTimeSec)
        : null,
    [hover, chartData, passes, mode, maxTimeSec],
  );
  const cursorSamples = useMemo(
    () =>
      positionFraction != null && chartData
        ? samplePassesAtFraction(passes, mode, positionFraction, maxTimeSec)
        : null,
    [positionFraction, chartData, passes, mode, maxTimeSec],
  );
  const hoverCursorX = hover ? hover.fraction * 100 : null;

  if (!chartData) return null;

  const hoverTooltipLines =
    hoverSamples
      ?.filter((sample) => sample.hr != null)
      .map((sample) => `${sample.label}: ${formatHr(sample.hr)}`) ?? [];

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
          {formatHr(chartData.hrMax)}
        </span>
        <span
          className={cn(
            activityTrackChartStyles.axisLabel,
            axisLabelSize,
            activityTrackChartStyles.axisLeftBottom,
          )}
        >
          {formatHr(chartData.hrMin)}
        </span>
        {chartData.hasElevation ? (
          <>
            <span
              className={cn(
                activityTrackChartStyles.axisLabel,
                axisLabelSize,
                activityTrackChartStyles.axisRight,
              )}
            >
              {Math.round(chartData.elevMax)} m
            </span>
            <span
              className={cn(
                activityTrackChartStyles.axisLabel,
                axisLabelSize,
                activityTrackChartStyles.axisRightBottom,
              )}
            >
              {Math.round(chartData.elevMin)} m
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
          aria-label={interactive ? "Scrub position along segment" : undefined}
          {...svgHandlers}
        >
          <HrZoneBands bands={zoneBands} />
          {elevScale ? (
            <ChartGridLines
              gridLines={elevationGridLines}
              valueToChartY={(elev) => passCompareElevToChartY(elev, chartData)}
            />
          ) : null}
          {chartData.elevationArea ? (
            <path d={chartData.elevationArea} fill="#4a5568" fillOpacity={0.45} />
          ) : null}
          {chartData.elevationLine ? (
            <path
              d={chartData.elevationLine}
              fill="none"
              stroke="#6b7a8f"
              strokeOpacity={0.55}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {chartData.lines.map((line) => (
            <path
              key={line.label}
              d={line.path}
              fill="none"
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={line.dasharray}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
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
                style={{ top: `${passCompareElevToTopPercent(elev, chartData)}%` }}
              >
                {elev} m
              </span>
            ))}
          </div>
        ) : null}
        {hoverSamples?.map((sample) =>
          sample.hr != null && hover ? (
            <div
              key={`hover-${sample.label}`}
              className={activityTrackChartStyles.hoverOverlay}
              aria-hidden
            >
              <span
                className={activityTrackChartStyles.hoverDot}
                style={{
                  left: `${hover.fraction * 100}%`,
                  top: `${passCompareHrToTopPercent(sample.hr, chartData)}%`,
                  background: sample.color,
                  width: 8,
                  height: 8,
                  minWidth: 8,
                  minHeight: 8,
                  maxWidth: 8,
                  maxHeight: 8,
                }}
              />
            </div>
          ) : null,
        )}
        {cursorSamples?.map((sample) =>
          sample.hr != null && positionFraction != null ? (
            <div
              key={`cursor-${sample.label}`}
              className={activityTrackChartStyles.hoverOverlay}
              aria-hidden
            >
              <span
                className={activityTrackChartStyles.hoverDot}
                style={{
                  left: `${clampFraction(positionFraction) * 100}%`,
                  top: `${passCompareHrToTopPercent(sample.hr, chartData)}%`,
                  background: sample.color,
                  width: 9,
                  height: 9,
                  minWidth: 9,
                  minHeight: 9,
                  maxWidth: 9,
                  maxHeight: 9,
                }}
              />
            </div>
          ) : null,
        )}
        {chartData.lines.map((line) => (
          <div
            key={`end-${line.label}`}
            className={passCompareTrackChartStyles.endMarker}
            style={{
              left: `${line.endX}%`,
              top: `${chartYToTopPercent(line.endY)}%`,
              background: line.color,
            }}
            aria-hidden
          >
            {line.seriesIndex + 1}
          </div>
        ))}
      </div>

      <PassComparePassLegend
        passes={passes}
        maxHr={maxHr}
        hasElevation={chartData.hasElevation}
        size={size}
      />
    </div>
  );
};
