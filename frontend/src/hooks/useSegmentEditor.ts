import { useEffect, useMemo, useReducer } from "react";
import { editorActions } from "../app/appActions";
import { createEditorScreen } from "../app/editorTypes";
import { editorReducer } from "../app/editorReducer";
import {
  buildDraftHighlightPoints,
  buildParentSegmentHighlight,
} from "../lib/mapHighlights";
import { useActivityQuery } from "../queries/activities";
import { useActivityTracks } from "./useActivityTracks";
import {
  useCreateSegmentMutation,
  useSegmentCompareQuery,
  useUpdateSegmentMutation,
} from "../queries/segments";
import type { Segment } from "../types";
import { useMapRoutes } from "../app/useMapRoutes";
import {
  applyCloseLoop,
  applyEditorMapClick,
  segmentDraftFromSegment,
} from "./segmentEditorUtils";
import type { SegmentEditorMode } from "./segmentEditorTypes";

const editorNoticeForKind = (kind: SegmentEditorMode["kind"]): string => {
  if (kind === "edit") return "Adjust the segment start/end or settings, then save.";
  if (kind === "subset") return "Pick a shorter start/end within the highlighted parent segment.";
  return "Set start and end on this activity's route, then save.";
};

const resolveEditorMode = (
  routeMode: SegmentEditorMode,
  segments: Segment[],
): SegmentEditorMode | null => {
  if (routeMode.kind === "create") return routeMode;

  const segment = segments.find((s) => s.id === routeMode.segmentId);
  if (!segment) return null;

  if (routeMode.kind === "edit") {
    return {
      kind: "edit",
      activityId: segment.source_activity_id,
      segmentId: segment.id,
    };
  }

  return {
    kind: "subset",
    activityId: segment.source_activity_id,
    constrainIndices: { min: segment.start_index, max: segment.end_index },
  };
};

const createInitialEditorScreen = (
  mode: SegmentEditorMode,
  segments: Segment[],
) => {
  if (mode.kind === "create") {
    return createEditorScreen(mode, editorNoticeForKind(mode.kind));
  }

  const segment = segments.find((s) => s.id === mode.segmentId);
  if (!segment) {
    return createEditorScreen(mode, editorNoticeForKind(mode.kind));
  }

  if (mode.kind === "edit") {
    return createEditorScreen(
      {
        kind: "edit",
        activityId: segment.source_activity_id,
        segmentId: segment.id,
      },
      editorNoticeForKind("edit"),
      {
        draft: segmentDraftFromSegment(segment),
        name: segment.name,
        radius: segment.radius_m,
        matchThreshold: segment.match_threshold,
      },
    );
  }

  return createEditorScreen(
    {
      kind: "subset",
      activityId: segment.source_activity_id,
      constrainIndices: { min: segment.start_index, max: segment.end_index },
    },
    editorNoticeForKind("subset"),
    {
      draft: segmentDraftFromSegment(segment),
      name: `${segment.name} (shorter)`,
      radius: segment.radius_m,
      matchThreshold: segment.match_threshold,
    },
  );
};

type UseSegmentEditorOptions = {
  mode: SegmentEditorMode;
  segments: Segment[];
  enabled?: boolean;
};

export const useSegmentEditor = ({
  mode,
  segments,
  enabled = true,
}: UseSegmentEditorOptions) => {
  const resolvedMode = useMemo(
    () => resolveEditorMode(mode, segments),
    [mode, segments],
  );
  const [screen, dispatchEditor] = useReducer(
    editorReducer,
    resolvedMode ?? mode,
    (initialMode) => createInitialEditorScreen(initialMode, segments),
  );

  useEffect(() => {
    const initialMode =
      mode.kind === "create" || !resolvedMode ? mode : resolvedMode;
    if (!enabled) return;
    dispatchEditor(
      editorActions.replaceScreen(createInitialEditorScreen(initialMode, segments)),
    );
  }, [enabled, mode.kind, mode.activityId, mode.segmentId, resolvedMode, segments]);

  const editorActivityId = screen.mode.activityId;
  const segmentEntity =
    screen.mode.segmentId != null
      ? (segments.find((s) => s.id === screen.mode.segmentId) ?? null)
      : null;

  const compareQuery = useSegmentCompareQuery(
    segmentEntity?.id ?? null,
    null,
    enabled && screen.mode.kind !== "create" && segmentEntity != null,
  );
  const comparison = compareQuery.data ?? null;
  const displayActivityQuery = useActivityQuery(editorActivityId);
  const activityTracks = useActivityTracks(comparison, editorActivityId);
  const displayPoints =
    displayActivityQuery.data?.points ?? activityTracks[editorActivityId];
  const mapRoutes = useMapRoutes(editorActivityId, displayPoints);

  const parentSegmentHighlight = buildParentSegmentHighlight(screen.mode, displayPoints);
  const draftHighlightPoints = buildDraftHighlightPoints(screen.mode, displayPoints, screen.draft);

  const createSegmentMutation = useCreateSegmentMutation();
  const updateSegmentMutation = useUpdateSegmentMutation();

  const saveSegment = async (): Promise<number | null> => {
    const { start_lat, start_lon, end_lat, end_lon, start_index, end_index } = screen.draft;
    if (start_lat == null || start_lon == null || start_index == null) {
      dispatchEditor(
        editorActions.setError("Select a start point on the map first."),
      );
      return null;
    }
    if (end_lat == null || end_lon == null || end_index == null) {
      dispatchEditor(
        editorActions.setError(
          "Set the end: click the map, or choose Same as start.",
        ),
      );
      return null;
    }
    if (!screen.name.trim()) {
      dispatchEditor(editorActions.setError("Enter a segment name."));
      return null;
    }

    const radius_m = Math.min(200, Math.max(5, screen.radius));
    const match_threshold = Math.min(1, Math.max(0.5, screen.matchThreshold));
    dispatchEditor(editorActions.setError(null));

    try {
      const segment =
        screen.mode.kind === "edit" && screen.mode.segmentId != null
          ? await updateSegmentMutation.mutateAsync({
              id: screen.mode.segmentId,
              payload: {
                name: screen.name.trim(),
                start_lat,
                start_lon,
                end_lat,
                end_lon,
                radius_m,
                match_threshold,
              },
            })
          : await createSegmentMutation.mutateAsync({
              name: screen.name.trim(),
              source_activity_id: screen.mode.activityId,
              start_index,
              end_index,
              start_lat,
              start_lon,
              end_lat,
              end_lon,
              radius_m,
              match_threshold,
            });

      return segment.id;
    } catch (err) {
      dispatchEditor(
        editorActions.setError(err instanceof Error ? err.message : String(err)),
      );
      return null;
    }
  };

  const onMapClick = (lat: number, lon: number) => {
    if (!displayPoints?.length) return;
    dispatchEditor(
      editorActions.replaceScreen(applyEditorMapClick(screen, displayPoints, lat, lon)),
    );
  };

  const closeLoop = () => {
    if (!displayPoints?.length) return;
    dispatchEditor(editorActions.replaceScreen(applyCloseLoop(screen, displayPoints)));
  };

  const pickModeNotice = (pickMode: "start" | "end") => {
    if (pickMode === "start") return "Click the route for the segment start.";
    return "Click the route for the segment end (further along the path).";
  };

  return {
    screen,
    dispatchEditor,
    editorActivity: displayActivityQuery.data ?? null,
    segmentEntity,
    mapRoutes,
    parentSegmentHighlight,
    draftHighlightPoints,
    loading: createSegmentMutation.isPending || updateSegmentMutation.isPending,
    saveSegment,
    onMapClick,
    closeLoop,
    pickModeNotice,
    editorActions,
  };
};
