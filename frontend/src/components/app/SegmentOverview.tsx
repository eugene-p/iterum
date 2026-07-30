import { formatRelativePast } from "../../lib/formatRelativePast";
import { formatStretchLabel, stretchKindLabel, type StretchPassMetrics } from "../../stretchUtils";
import type { Segment, SegmentPass, Stretch } from "../../types";
import { formatDistance, formatDuration } from "../../utils";
import { Badge, MetricSummary } from "../ui";

type SegmentOverviewProps = {
  segment: Segment;
  matchedPasses: ReadonlyArray<SegmentPass>;
  stretchCount: number;
  selectedStretch?: Stretch | null;
  selectedStretchMetrics?: ReadonlyArray<StretchPassMetrics>;
};

const matchedActivityCount = (passes: ReadonlyArray<SegmentPass>) =>
  new Set(passes.map((pass) => pass.activity_id)).size;

/** Compact, data-first summary for the segment comparison workspace. */
export const SegmentOverview = ({
  segment,
  matchedPasses,
  stretchCount,
  selectedStretch = null,
  selectedStretchMetrics = [],
}: SegmentOverviewProps) => {
  const fastestPass = matchedPasses.reduce<SegmentPass | null>((fastest, pass) => {
    if (pass.duration_sec == null) return fastest;
    if (fastest?.duration_sec == null || pass.duration_sec < fastest.duration_sec) return pass;
    return fastest;
  }, null);
  const activityCount = segment.match_activity_count ?? matchedActivityCount(matchedPasses);
  const lastMatched = segment.last_matched_at ? formatRelativePast(segment.last_matched_at) : null;
  const metadata = [segment.location, `${segment.radius_m} m match radius`]
    .filter(Boolean)
    .join(" · ");
  const fastestStretchPass = selectedStretchMetrics.reduce<StretchPassMetrics | null>(
    (fastest, metrics) => {
      if (metrics.duration_sec == null) return fastest;
      if (fastest?.duration_sec == null || metrics.duration_sec < fastest.duration_sec) return metrics;
      return fastest;
    },
    null,
  );
  const selectedElevation = selectedStretch
    ? `${selectedStretch.elevation_delta_m > 0 ? "+" : ""}${Math.round(selectedStretch.elevation_delta_m)} m`
    : "—";

  return (
    <MetricSummary
      label={selectedStretch ? "Selected stretch summary" : "Segment summary"}
      className="snap-start scroll-mt-3"
      tags={
        !selectedStretch && segment.tags?.map((tag) => <Badge key={tag}>{tag}</Badge>)
      }
      metadata={
        selectedStretch
          ? `${formatStretchLabel(selectedStretch)} · ${stretchKindLabel(selectedStretch.kind)}`
          : metadata
      }
      metrics={
        selectedStretch
          ? [
              { label: "Length", value: formatDistance(selectedStretch.length_m) },
              { label: "Avg grade", value: `${selectedStretch.avg_grade_pct.toFixed(1)}%` },
              { label: "Elev. change", value: selectedElevation },
              { label: "Compared", value: selectedStretchMetrics.length || matchedPasses.length },
              { label: "Fastest", value: formatDuration(fastestStretchPass?.duration_sec) },
            ]
          : [
              { label: "Matched passes", value: matchedPasses.length },
              { label: "Activities", value: activityCount },
              { label: "Fastest pass", value: formatDuration(fastestPass?.duration_sec) },
              { label: "Stretches", value: stretchCount },
              { label: "Last matched", value: lastMatched ?? "—" },
            ]
      }
    />
  );
};
