import { formatStretchLabel } from "../../../stretchUtils";
import { ActivityTrackChart } from "../../activities/ActivityTrackChart";
import {
  PassCompareTrackChart,
  passChartItemsFromRows,
  passesHaveHeartRate,
} from "./PassCompareTrackChart";
import { MetricsGrid } from "./MetricsGrid";
import { PassMetricsRow } from "./PassMetricsRow";
import { SectionHint } from "./SectionHint";
import { StretchProgressLegend } from "./StretchProgressLegend";
import { MutedSpan, MutedText } from "../../ui";
import { HrChartCollapsibleSection } from "./HrChartCollapsibleSection";
import { CompareMapStage } from "./CompareMapStage";
import { CompareReferenceCard } from "./CompareReferenceCard";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";
import type { PositionComparePanelProps } from "./positionCompareTypes";

export const PositionComparePanel = ({
  isActivity,
  zoneMaxHr,
  activityDurationSec,
  matchedPasses = [],
  slider,
  map,
  metrics,
}: PositionComparePanelProps) => {
  const passChartItems = passChartItemsFromRows(metrics.passRows, matchedPasses);
  const showActivityTrackChart =
    isActivity && map.routePoints.some((point) => point.heart_rate != null);
  const showPassCompareTrackChart = !isActivity && passesHaveHeartRate(passChartItems);
  const showHrChartSection = showActivityTrackChart || showPassCompareTrackChart;

  return (
    <>
      <section className={`${routeExplorerStyles.section} ${routeExplorerStyles.sectionControls}`}>
        <div className={routeExplorerStyles.sectionHead}>
          <div className={routeExplorerStyles.sectionHeadLead}>
            <h3 className={routeExplorerStyles.sectionTitle}>
              Position along {isActivity ? "activity" : "segment"}
            </h3>
            <SectionHint text="Drag the slider or click the route on the map." />
          </div>
          <MutedSpan>
            {slider.max > 0
              ? [
                  `${Math.round(slider.fraction * 100)}%`,
                  slider.currentStretch ? formatStretchLabel(slider.currentStretch) : null,
                  `point ${slider.index + 1} of ${slider.max + 1}`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Start"}
          </MutedSpan>
        </div>
        <input
          className={routeExplorerStyles.slider}
          type="range"
          min={0}
          max={slider.max}
          value={slider.index}
          onChange={(e) => slider.onChange(Number(e.target.value))}
        />
      </section>

      {showHrChartSection ? (
        <HrChartCollapsibleSection
          passCount={showPassCompareTrackChart ? passChartItems.length : undefined}
        >
          {showActivityTrackChart ? (
            <ActivityTrackChart
              points={map.routePoints}
              maxHr={zoneMaxHr}
              durationSec={activityDurationSec}
              positionFraction={slider.fraction}
              onPositionFractionChange={(fraction) =>
                slider.onChange(Math.round(fraction * slider.max))
              }
            />
          ) : (
            <PassCompareTrackChart
              passes={passChartItems}
              elevationPoints={map.routePoints}
              mode="position"
              maxHr={zoneMaxHr}
              positionFraction={slider.fraction}
              onPositionFractionChange={(fraction) =>
                slider.onChange(Math.round(fraction * slider.max))
              }
              expandable
              expandTitle="Compare passes — heart rate & elevation"
            />
          )}
        </HrChartCollapsibleSection>
      ) : null}

      <CompareMapStage
        routePoints={map.routePoints}
        highlightPoints={map.highlightPoints}
        stretchOverlays={map.stretchOverlays}
        markers={map.markers}
        onPositionClick={slider.onChange}
        clickableRoute={map.clickableRoute}
        legendLabel="Metrics at current position"
      >
        <h3 className={routeExplorerStyles.legendTitle}>At this point</h3>
        {metrics.showPositionLegend && <StretchProgressLegend />}
        {isActivity ? (
          <MetricsGrid metrics={metrics.activity} />
        ) : (
          <>
            {metrics.reference ? (
              <CompareReferenceCard
                metrics={metrics.reference}
                stretchContext={metrics.referenceStretchContext}
                positionColor={metrics.referencePositionColor}
              />
            ) : null}
            {metrics.passRows.length === 0 ? (
              <MutedText className="border-b border-border px-2 py-3">
                Select at least one matched pass above.
              </MutedText>
            ) : (
              metrics.passRows.map((row) => (
                <PassMetricsRow
                  key={`pos-${row.slice.pass.id}`}
                  slice={row.slice}
                  index={row.index}
                  color={row.color}
                  positionColor={row.positionColor}
                  stretchContext={row.stretchContext}
                />
              ))
            )}
          </>
        )}
      </CompareMapStage>
    </>
  );
};
