import type { Segment, TrackPoint } from "../types";
import { nearestTrackPointIndex, nearestTrackPointIndexAfter } from "../utils";
import type { EditorScreen } from "../app/editorTypes";
import type { SegmentDraft } from "./segmentEditorTypes";

export const segmentDraftFromSegment = (segment: Segment): Partial<SegmentDraft> => ({
  start_lat: segment.start_lat,
  start_lon: segment.start_lon,
  end_lat: segment.end_lat,
  end_lon: segment.end_lon,
  start_index: segment.start_index,
  end_index: segment.end_index,
});

const isIndexWithinBounds = (
  index: number,
  constrainIndices?: { min: number; max: number },
): boolean => {
  if (!constrainIndices || index < 0) return true;
  return index >= constrainIndices.min && index <= constrainIndices.max;
};

export const applyEditorMapClick = (
  screen: EditorScreen,
  displayPoints: TrackPoint[],
  lat: number,
  lon: number,
): EditorScreen => {
  const pointIndex = nearestTrackPointIndex(displayPoints, lat, lon);
  if (!isIndexWithinBounds(pointIndex, screen.mode.constrainIndices)) {
    return { ...screen, error: "Pick a point within the parent segment." };
  }

  const snapped = pointIndex >= 0 ? displayPoints[pointIndex] : null;
  const pickLat = snapped?.lat ?? lat;
  const pickLon = snapped?.lon ?? lon;

  if (screen.pickMode === "start") {
    return {
      ...screen,
      draft: {
        start_lat: pickLat,
        start_lon: pickLon,
        start_index: pointIndex >= 0 ? pointIndex : undefined,
      },
      pickMode: "end",
      error: null,
      notice: "Start set. Click the route for the segment end.",
    };
  }

  if (screen.pickMode === "end") {
    const startIdx = screen.draft.start_index;
    let endIndex = pointIndex;
    if (startIdx != null && endIndex <= startIdx) {
      endIndex = nearestTrackPointIndexAfter(displayPoints, startIdx, pickLat, pickLon);
    }
    if (!isIndexWithinBounds(endIndex, screen.mode.constrainIndices)) {
      return { ...screen, error: "End must stay within the parent segment." };
    }
    if (startIdx != null && endIndex <= startIdx) {
      return { ...screen, error: "Pick an end point further along the route (ahead of the start)." };
    }
    const endPoint = endIndex >= 0 ? displayPoints[endIndex] : null;
    return {
      ...screen,
      draft: {
        ...screen.draft,
        end_lat: endPoint?.lat ?? pickLat,
        end_lon: endPoint?.lon ?? pickLon,
        end_index: endIndex >= 0 ? endIndex : undefined,
      },
      pickMode: "none",
      error: null,
      notice:
        screen.mode.kind === "edit"
          ? "End set. Click Save changes when ready."
          : "End set. Click Save segment when ready.",
    };
  }

  return screen;
};