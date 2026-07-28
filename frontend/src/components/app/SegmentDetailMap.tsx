import { memo, useCallback } from "react";
import type { Segment, TrackPoint } from "../../types";
import { ActivityMap, type StretchOverlay } from "../maps/ActivityMap/ActivityMap";
import { ExpandableDetailMap } from "../maps/ExpandableDetailMap";
import type { MapRoute } from "./segmentDetailTypes";

type SegmentDetailMapProps = {
  routes: MapRoute[];
  segment: Segment;
  segmentHighlightPoints: TrackPoint[];
  stretchOverlays: StretchOverlay[];
};

const areMapPropsEqual = (prev: SegmentDetailMapProps, next: SegmentDetailMapProps) =>
  prev.routes === next.routes &&
  prev.segment.id === next.segment.id &&
  prev.segment.name === next.segment.name &&
  prev.segmentHighlightPoints === next.segmentHighlightPoints &&
  prev.stretchOverlays === next.stretchOverlays;

export const SegmentDetailMap = memo(function SegmentDetailMap({
  routes,
  segment,
  segmentHighlightPoints,
  stretchOverlays,
}: SegmentDetailMapProps) {
  const hasContent = routes.length > 0;
  const renderMap = useCallback(
    () => (
      <ActivityMap
        routes={routes}
        segment={segment}
        segmentDraft={undefined}
        segmentHighlight={segmentHighlightPoints}
        draftHighlight={[]}
        stretchOverlays={stretchOverlays}
        segmentMode="none"
      />
    ),
    [routes, segment, segmentHighlightPoints, stretchOverlays],
  );

  return (
    <ExpandableDetailMap
      title={segment.name}
      hasContent={hasContent}
      emptyMessage="Loading route…"
      renderMap={renderMap}
    />
  );
}, areMapPropsEqual);
