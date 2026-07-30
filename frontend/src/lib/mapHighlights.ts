import {
  buildStretchPassMetrics,
  computeStretchPassMetrics,
  slicePassPoints,
  slicePointsByDistance,
  stretchKindColor,
  stretchPathSlices,
} from "../stretchUtils";
import type { StretchPassMetrics } from "../stretchUtils";
import type { SegmentCompare, SegmentPass, Stretch, TrackPoint } from "../types";
import { sliceDraftOnTrack } from "../utils";
import type { SegmentDraft, SegmentEditorMode } from "../hooks/segmentEditorTypes";
import {
  buildPathContext,
  pointAtPathDistance,
  projectStretchBoundaries,
} from "./stretchEdit";

type SegmentDraftInput = Partial<SegmentDraft>;

export const buildParentSegmentHighlight = (
  segmentEditor: SegmentEditorMode | null,
  displayPoints: TrackPoint[] | undefined,
): TrackPoint[] => {
  if (segmentEditor?.kind !== "subset" || !displayPoints?.length || !segmentEditor.constrainIndices) {
    return [];
  }
  const { min, max } = segmentEditor.constrainIndices;
  return displayPoints.slice(min, max + 1);
};

export const buildReferenceHighlight = (
  segmentEditor: SegmentEditorMode | null,
  comparison: SegmentCompare | null,
): TrackPoint[] => {
  if (segmentEditor || !comparison?.reference_points?.length) return [];
  return comparison.reference_points;
};

export const buildSegmentHighlightPoints = (
  segmentEditor: SegmentEditorMode | null,
  displayPoints: TrackPoint[] | undefined,
  selectedPass: SegmentPass | null,
  referenceHighlight: TrackPoint[],
): TrackPoint[] => {
  if (segmentEditor || !displayPoints?.length) return [];
  if (selectedPass?.start_index != null && selectedPass.end_index != null) {
    return displayPoints.slice(selectedPass.start_index, selectedPass.end_index + 1);
  }
  return referenceHighlight;
};

export const buildStretchOverlays = (
  segmentEditor: SegmentEditorMode | null,
  comparison: SegmentCompare | null,
  segmentHighlightPoints: TrackPoint[],
  selectedStretchIndex: number | null,
  stretchesOverride?: Stretch[] | null,
) => {
  const stretches = stretchesOverride ?? comparison?.stretches ?? [];
  if (segmentEditor || !stretches.length || segmentHighlightPoints.length < 2) {
    return [];
  }
  if (selectedStretchIndex == null) return [];

  return stretchPathSlices(segmentHighlightPoints, stretches)
    .filter(
      ({ stretch }, arrayIndex) =>
        arrayIndex === selectedStretchIndex ||
        stretch.index === selectedStretchIndex,
    )
    .map(({ stretch, points }) => ({
      id: stretch.index,
      points,
      color: stretchKindColor(stretch.kind),
    }))
    .filter((overlay) => overlay.points.length > 1);
};

export type SplitMapPreview = {
  overlays: Array<{ id: number | string; points: TrackPoint[]; color: string }>;
  cutMarker: { lat: number; lon: number } | null;
};

/**
 * Live map preview while placing a split cut on the selected stretch.
 * Left half keeps stretch kind color; right half is muted; cut is a marker.
 */
export const buildSplitMapPreview = (
  segmentHighlightPoints: TrackPoint[],
  stretches: Stretch[],
  selectedIndex: number,
  cutDistanceM: number,
): SplitMapPreview => {
  if (segmentHighlightPoints.length < 2 || selectedIndex < 0 || selectedIndex >= stretches.length) {
    return { overlays: [], cutMarker: null };
  }
  const path = buildPathContext(segmentHighlightPoints);
  if (!path) return { overlays: [], cutMarker: null };

  const bounds = projectStretchBoundaries(stretches, path);
  const startD = bounds[selectedIndex];
  const endD = bounds[selectedIndex + 1];
  if (startD == null || endD == null || endD <= startD) {
    return { overlays: [], cutMarker: null };
  }
  const cut = Math.max(startD, Math.min(endD, cutDistanceM));
  const cutGeo = pointAtPathDistance(path, cut);
  if (!cutGeo) return { overlays: [], cutMarker: null };

  const stretch = stretches[selectedIndex];
  const leftPoints = slicePointsByDistance(segmentHighlightPoints, startD, cut);
  const rightPoints = slicePointsByDistance(segmentHighlightPoints, cut, endD);

  const cutTrackPoint: TrackPoint = {
    lat: cutGeo.lat,
    lon: cutGeo.lon,
    elevation_m: cutGeo.elevation_m,
  };
  // Ensure both polylines include the cut vertex for a continuous join.
  const left =
    leftPoints.length &&
    leftPoints[leftPoints.length - 1].lat === cutTrackPoint.lat &&
    leftPoints[leftPoints.length - 1].lon === cutTrackPoint.lon
      ? leftPoints
      : [...leftPoints, cutTrackPoint];
  const right =
    rightPoints.length &&
    rightPoints[0].lat === cutTrackPoint.lat &&
    rightPoints[0].lon === cutTrackPoint.lon
      ? rightPoints
      : [cutTrackPoint, ...rightPoints];

  return {
    overlays: [
      {
        id: "split-left",
        points: left,
        color: stretchKindColor(stretch.kind),
      },
      {
        id: "split-right",
        points: right,
        color: "#94a3b8",
      },
    ].filter((o) => o.points.length > 1),
    cutMarker: { lat: cutGeo.lat, lon: cutGeo.lon },
  };
};

export const buildDraftHighlightPoints = (
  segmentEditor: SegmentEditorMode | null,
  displayPoints: TrackPoint[] | undefined,
  segmentDraft: SegmentDraftInput,
): TrackPoint[] => {
  if (!segmentEditor || !displayPoints?.length) return [];
  const { start_lat, start_lon, end_lat, end_lon } = segmentDraft;
  if (start_lat == null || start_lon == null || end_lat == null || end_lon == null) return [];
  return (
    sliceDraftOnTrack(displayPoints, {
      start_lat,
      start_lon,
      end_lat,
      end_lon,
      start_index: segmentDraft.start_index,
      end_index: segmentDraft.end_index,
    }) ?? []
  );
};

export const buildFullPassMetrics = (
  passes: SegmentPass[] | undefined,
): StretchPassMetrics[] => {
  if (!passes?.length) return [];
  return passes.map((pass) => ({
    pass,
    distance_m: pass.distance_m ?? 0,
    duration_sec: pass.duration_sec ?? null,
    avg_speed_kmh: pass.avg_speed_kmh ?? null,
    avg_hr: pass.avg_hr ?? null,
    elevation_gain_m: pass.elevation_gain_m ?? null,
  }));
};

export const buildStretchPassMetricsForStretch = (
  selectedStretch: Stretch | null,
  passes: SegmentCompare["passes"] | undefined,
  activityTracks: Record<number, TrackPoint[]>,
) => {
  if (!selectedStretch || !passes?.length) return [];
  return buildStretchPassMetrics(selectedStretch, passes, activityTracks);
};

export const buildSelectedPassStretchMetrics = (
  selectedStretch: Stretch | null,
  selectedPass: SegmentPass | null,
  activityTracks: Record<number, TrackPoint[]>,
) => {
  if (!selectedStretch || !selectedPass) return null;
  const passPoints = slicePassPoints(activityTracks[selectedPass.activity_id] ?? [], selectedPass);
  if (passPoints.length < 2) return null;
  return computeStretchPassMetrics(selectedStretch, passPoints, selectedPass.duration_sec);
};