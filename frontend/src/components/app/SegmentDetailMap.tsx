import { memo } from "react";
import { appStyles } from "../../App.styles";
import type { Segment, TrackPoint } from "../../types";
import { ActivityMap, type StretchOverlay } from "../maps/ActivityMap/ActivityMap";
import type { MapRoute } from "./segmentDetailTypes";
import { EmptySurface } from "../ui";

type SegmentDetailMapProps = {
  routes: MapRoute[];
  segment: Segment;
  segmentHighlightPoints: TrackPoint[];
  stretchOverlays: StretchOverlay[];
};

const areMapPropsEqual = (prev: SegmentDetailMapProps, next: SegmentDetailMapProps) =>
  prev.routes === next.routes &&
  prev.segment.id === next.segment.id &&
  prev.segmentHighlightPoints === next.segmentHighlightPoints &&
  prev.stretchOverlays === next.stretchOverlays;

export const SegmentDetailMap = memo(function SegmentDetailMap({
  routes,
  segment,
  segmentHighlightPoints,
  stretchOverlays,
}: SegmentDetailMapProps) {
  return (
    <div className={appStyles.mapWrap}>
      {routes.length ? (
        <ActivityMap
          routes={routes}
          segment={segment}
          segmentDraft={undefined}
          segmentHighlight={segmentHighlightPoints}
          draftHighlight={[]}
          stretchOverlays={stretchOverlays}
          segmentMode="none"
        />
      ) : (
        <EmptySurface style={{ height: "100%" }}>Loading route…</EmptySurface>
      )}
    </div>
  );
}, areMapPropsEqual);