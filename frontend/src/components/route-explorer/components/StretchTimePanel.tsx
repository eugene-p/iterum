import { formatStretchLabel } from "../../../stretchUtils";
import { formatDuration } from "../../../utils";
import {
  PassCompareTrackChart,
  passChartItemsFromStretchRows,
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
import type { StretchTimePanelProps } from "./positionCompareTypes";

export const StretchTimePanel = ({
  zoneMaxHr = null,
  matchedPasses = [],
  slider,
  map,
  metrics,
}: StretchTimePanelProps) => {
  const passChartItems =
    slider.currentStretch != null
      ? passChartItemsFromStretchRows(
          metrics.passRows,
          slider.currentStretch,
          slider.localMaxSec,
          matchedPasses,
        )
      : [];
  const showPassCompareTrackChart = passesHaveHeartRate(passChartItems);
  const localFraction =
    slider.localMaxSec > 0 ? slider.localElapsedSec / slider.localMaxSec : 0;

  return (
    <>
      <section className={`${routeExplorerStyles.section} ${routeExplorerStyles.sectionControls}`}>
        <div className={routeExplorerStyles.sectionHead}>
          <div className={routeExplorerStyles.sectionHeadLead}>
            <h3 className={routeExplorerStyles.sectionTitle}>Stretch time</h3>
            <SectionHint text="All passes start together at the current stretch. Drag through the end to re-align at the next stretch start; drag reverse to the previous stretch end." />
          </div>
          <MutedSpan>
            {[
              slider.currentStretch ? formatStretchLabel(slider.currentStretch) : null,
              slider.stretchesCount > 0
                ? `${slider.stretchIndex + 1} of ${slider.stretchesCount}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </MutedSpan>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="shrink-0 rounded border border-border px-2 py-0.5 text-[0.78rem] text-subtle disabled:opacity-40"
            disabled={!slider.canPrev}
            onClick={slider.onPrev}
            aria-label="Previous stretch"
          >
            ←
          </button>
          <input
            className={routeExplorerStyles.slider}
            type="range"
            min={0}
            max={Math.max(slider.virtualMaxSec, 5)}
            step={slider.step}
            value={slider.virtualSec}
            onChange={(e) => slider.onVirtualChange(Number(e.target.value))}
          />
          <button
            type="button"
            className="shrink-0 rounded border border-border px-2 py-0.5 text-[0.78rem] text-subtle disabled:opacity-40"
            disabled={!slider.canNext}
            onClick={slider.onNext}
            aria-label="Next stretch"
          >
            →
          </button>
        </div>

        <MutedSpan className="text-[0.78rem]">
          {[
            `${formatDuration(slider.localElapsedSec)} / ${formatDuration(slider.localMaxSec)} in stretch`,
            slider.virtualMaxSec > 0
              ? `${formatDuration(slider.virtualSec)} / ${formatDuration(slider.virtualMaxSec)} along stretches`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </MutedSpan>
      </section>

      {showPassCompareTrackChart && slider.currentStretch ? (
        <HrChartCollapsibleSection passCount={passChartItems.length}>
          <PassCompareTrackChart
            passes={passChartItems}
            elevationPoints={map.stretchElevationPoints ?? map.routePoints}
            mode="time"
            maxTimeSec={slider.localMaxSec}
            maxHr={zoneMaxHr}
            positionFraction={localFraction}
            onPositionFractionChange={slider.onLocalFractionChange}
            expandable
            expandTitle="Compare passes — heart rate & elevation (this stretch)"
          />
        </HrChartCollapsibleSection>
      ) : null}

      <CompareMapStage
        routePoints={map.routePoints}
        stretchOverlays={map.stretchOverlays}
        markers={map.markers}
        fitPoints={map.fitPoints ?? map.stretchElevationPoints}
        fitAnimate
        fitKey={map.fitKey ?? (slider.currentStretch != null ? `stretch-${slider.currentStretch.index}` : "stretch")}
        legendLabel="Metrics at this stretch time"
      >
        <h3 className={routeExplorerStyles.legendTitle}>At this stretch time</h3>
        {metrics.showPositionLegend && <StretchProgressLegend mode="stretch" />}
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
              key={`stretch-${row.slice.pass.id}`}
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
