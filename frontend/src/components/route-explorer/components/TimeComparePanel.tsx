import { formatStretchLabel } from "../../../stretchUtils";
import { formatDuration } from "../../../utils";
import {
  PassCompareTrackChart,
  passChartItemsFromRows,
  passesHaveHeartRate,
} from "./PassCompareTrackChart";
import { PassMetricsRow } from "./PassMetricsRow";
import { SectionHint } from "./SectionHint";
import { StretchProgressLegend } from "./StretchProgressLegend";
import { MutedSpan, MutedText } from "../../ui";
import { HrChartCollapsibleSection } from "./HrChartCollapsibleSection";
import { CompareMapStage } from "./CompareMapStage";
import { CompareReferenceCard } from "./CompareReferenceCard";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";
import type { TimeComparePanelProps } from "./positionCompareTypes";

/** Segment time: align all passes at segment start; scrub full-effort elapsed. */
export const TimeComparePanel = ({
  zoneMaxHr = null,
  matchedPasses = [],
  slider,
  map,
  metrics,
}: TimeComparePanelProps) => {
  const passChartItems = passChartItemsFromRows(metrics.passRows, matchedPasses);
  const showPassCompareTrackChart = passesHaveHeartRate(passChartItems);
  const timeFraction = slider.maxSec > 0 ? slider.elapsedSec / slider.maxSec : 0;

  return (
    <>
      <section className={`${routeExplorerStyles.section} ${routeExplorerStyles.sectionControls}`}>
        <div className={routeExplorerStyles.sectionHead}>
          <div className={routeExplorerStyles.sectionHeadLead}>
            <h3 className={routeExplorerStyles.sectionTitle}>Segment time</h3>
            <SectionHint text="All matched passes start together at the segment start. Scrub time to see where each was after that many minutes." />
          </div>
          <MutedSpan>
            {[
              formatDuration(slider.elapsedSec),
              slider.maxSec > 0 ? `/ ${formatDuration(slider.maxSec)}` : null,
              slider.currentStretch ? formatStretchLabel(slider.currentStretch) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </MutedSpan>
        </div>
        <input
          className={routeExplorerStyles.slider}
          type="range"
          min={0}
          max={Math.max(slider.maxSec, 5)}
          step={slider.step}
          value={slider.elapsedSec}
          onChange={(e) => slider.onChange(Number(e.target.value))}
        />
      </section>

      {showPassCompareTrackChart ? (
        <HrChartCollapsibleSection passCount={passChartItems.length}>
          <PassCompareTrackChart
            passes={passChartItems}
            elevationPoints={map.routePoints}
            mode="time"
            maxTimeSec={slider.maxSec}
            maxHr={zoneMaxHr}
            positionFraction={timeFraction}
            onPositionFractionChange={(fraction) =>
              slider.onChange(Math.round(fraction * slider.maxSec))
            }
            expandable
            expandTitle="Compare passes — heart rate & elevation"
          />
        </HrChartCollapsibleSection>
      ) : null}

      <CompareMapStage
        routePoints={map.routePoints}
        stretchOverlays={map.stretchOverlays}
        markers={map.markers}
        legendLabel="Metrics at this segment time"
      >
        <h3 className={routeExplorerStyles.legendTitle}>At this segment time</h3>
        {metrics.showPositionLegend && <StretchProgressLegend mode="segment" />}
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
              key={`segment-${row.slice.pass.id}`}
              slice={row.slice}
              index={row.index}
              color={row.color}
              positionColor={row.positionColor}
              stretchContext={row.stretchContext}
            />
          ))
        )}
      </CompareMapStage>
    </>
  );
};
