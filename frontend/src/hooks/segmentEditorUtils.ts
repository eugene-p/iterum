import type { Segment, TrackPoint } from "../types";
import {
  MIN_LOOP_PATH_DISTANCE_M,
  nearestTrackPointIndex,
  resolveLoopTrackIndices,
  resolveOrderedTrackIndices,
} from "../utils";
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

const resolveOnTrack = (
  displayPoints: TrackPoint[],
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
  mode: "end" | "loop",
  constrainIndices?: { min: number; max: number },
  matchRadiusM?: number,
): { start_index: number; end_index: number } | null => {
  const resolve = (points: TrackPoint[]) =>
    mode === "loop"
      ? resolveLoopTrackIndices(points, {
          start,
          end,
          match_radius_m: matchRadiusM,
        })
      : resolveOrderedTrackIndices(points, { start, end });

  if (!constrainIndices) {
    return resolve(displayPoints);
  }

  const { min, max } = constrainIndices;
  if (max - min < 1) return null;
  const slice = displayPoints.slice(min, max + 1);
  const resolved = resolve(slice);
  if (!resolved) return null;
  return {
    start_index: resolved.start_index + min,
    end_index: resolved.end_index + min,
  };
};

const applyResolvedEndpoints = (
  screen: EditorScreen,
  displayPoints: TrackPoint[],
  resolved: { start_index: number; end_index: number },
): EditorScreen => {
  const startPoint = displayPoints[resolved.start_index];
  const endPoint = displayPoints[resolved.end_index];
  return {
    ...screen,
    draft: {
      start_lat: startPoint.lat,
      start_lon: startPoint.lon,
      end_lat: endPoint.lat,
      end_lon: endPoint.lon,
      start_index: resolved.start_index,
      end_index: resolved.end_index,
    },
    pickMode: "none",
    error: null,
    notice: null,
  };
};

export const applyEditorMapClick = (
  screen: EditorScreen,
  displayPoints: TrackPoint[],
  lat: number,
  lon: number,
): EditorScreen => {
  if (screen.pickMode === "start") {
    const pointIndex = nearestTrackPointIndex(displayPoints, lat, lon);
    if (!isIndexWithinBounds(pointIndex, screen.mode.constrainIndices)) {
      return { ...screen, error: "Pick a point within the parent segment." };
    }
    // Provisional only: store click location for the marker. Do not lock a track
    // index yet — out-and-back nearest snaps bind to the wrong visit / direction.
    // Indices are resolved only when the end is chosen (map or same-as-start).
    return {
      ...screen,
      draft: {
        start_lat: lat,
        start_lon: lon,
      },
      pickMode: "end",
      error: null,
      notice: null,
    };
  }

  const pickingEnd =
    screen.pickMode === "end" ||
    (screen.pickMode === "none" &&
      screen.draft.start_lat != null &&
      screen.draft.end_lat == null);

  if (pickingEnd) {
    const startLat = screen.draft.start_lat;
    const startLon = screen.draft.start_lon;
    if (startLat == null || startLon == null) {
      return {
        ...screen,
        error: "Select a start point first.",
      };
    }

    const resolved = resolveOnTrack(
      displayPoints,
      { lat: startLat, lon: startLon },
      { lat, lon },
      "end",
      screen.mode.constrainIndices,
    );
    if (!resolved) {
      return {
        ...screen,
        error: `Pick an end further along the route (at least ${MIN_LOOP_PATH_DISTANCE_M} m of path from the start).`,
      };
    }

    return applyResolvedEndpoints(screen, displayPoints, resolved);
  }

  return screen;
};

/** End at the same place as start (one lap) — no second map click. */
export const applyCloseLoop = (
  screen: EditorScreen,
  displayPoints: TrackPoint[],
): EditorScreen => {
  const startLat = screen.draft.start_lat;
  const startLon = screen.draft.start_lon;
  if (startLat == null || startLon == null) {
    return {
      ...screen,
      error: "Select a start point first.",
    };
  }

  const start = { lat: startLat, lon: startLon };
  // Never pass a provisional start_index — resolve earliest start + first return.
  const resolved = resolveOnTrack(
    displayPoints,
    start,
    start,
    "loop",
    screen.mode.constrainIndices,
    screen.radius,
  );
  if (!resolved) {
    return {
      ...screen,
      error:
        `Could not set end same as start. No return within the match radius after leaving the start (loops under ${MIN_LOOP_PATH_DISTANCE_M} m path distance are not matched).`,
    };
  }

  return applyResolvedEndpoints(screen, displayPoints, resolved);
};
