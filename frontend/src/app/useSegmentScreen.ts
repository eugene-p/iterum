import { useEffect, useMemo, useReducer, useState } from "react";
import {
  buildReferenceHighlight,
  buildSegmentHighlightPoints,
  buildSelectedPassStretchMetrics,
  buildStretchOverlays,
} from "../lib/mapHighlights";
import {
  useCreateReversedSegmentMutation,
  useDeleteSegmentMutation,
  useRescanSegmentMutation,
  useSaveSegmentStretchesMutation,
  useSegmentCompareQuery,
} from "../queries/segments";
import type { Stretch, StretchThresholds } from "../types";
import {
  DEFAULT_STRETCH_THRESHOLDS,
  isStretchPreviewDirty,
  thresholdsEqual,
  type SavedStretchBaseline,
} from "../stretchUtils";
import { useProfileContext } from "./ProfileContext";
import { segmentUiActions, shellActions } from "./appActions";
import { SEGMENT_UI_ACTION_TYPES } from "./segmentUiActionTypes";
import { useAppWorkspace } from "./useAppWorkspaceContext";
import { useMapRoutes } from "./useMapRoutes";
import { initialSegmentUiState, segmentUiReducer } from "./segmentUiReducer";
import { resolveDisplayActivityId } from "../lib/resolveDisplayActivityId";
import { useActivityTracks } from "../hooks/useActivityTracks";
export const useSegmentScreen = (segmentId: number) => {
  const { segments, dispatch, navigation } = useAppWorkspace();
  const { profileStretchDefaults } = useProfileContext();
  const profileThresholds = profileStretchDefaults ?? DEFAULT_STRETCH_THRESHOLDS;
  const [ui, dispatchUi] = useReducer(segmentUiReducer, initialSegmentUiState);
  const [editError, setEditError] = useState<string | null>(null);
  const [savedStretchBaseline, setSavedStretchBaseline] =
    useState<SavedStretchBaseline | null>(null);

  useEffect(() => {
    dispatchUi({ type: SEGMENT_UI_ACTION_TYPES.RESET });
    setEditError(null);
    setSavedStretchBaseline(null);
  }, [segmentId]);

  const segmentEntity = segments.find((s) => s.id === segmentId) ?? null;

  const compareQuery = useSegmentCompareQuery(segmentId, ui.stretchPreview, true);
  const comparison = compareQuery.data ?? null;
  const saveStretchesMutation = useSaveSegmentStretchesMutation();

  const captureStretchBaseline = (data: NonNullable<typeof comparison>) => {
    setSavedStretchBaseline({
      stretchSourceActivityId:
        data.stretch_source_activity_id ?? data.segment.source_activity_id,
      thresholds: data.stretch_thresholds,
    });
  };

  const ensureStretchBaseline = () => {
    if (savedStretchBaseline != null || !comparison) return;
    captureStretchBaseline(comparison);
  };

  useEffect(() => {
    if (!comparison || ui.stretchPreview) return;
    captureStretchBaseline(comparison);
  }, [
    comparison,
    ui.stretchPreview,
    comparison?.stretch_source_activity_id,
    comparison?.stretch_thresholds,
    comparison?.segment.source_activity_id,
  ]);

  const stretchCanSave = useMemo(() => {
    if (!comparison || !ui.stretchPreview || !savedStretchBaseline) return false;
    return isStretchPreviewDirty(ui.stretchPreview, savedStretchBaseline);
  }, [comparison, ui.stretchPreview, savedStretchBaseline]);

  const stretchSourcePass = useMemo(() => {
    if (!comparison) return null;
    const stretchSourceActivityId =
      comparison.stretch_source_activity_id ?? comparison.segment.source_activity_id;
    return (
      comparison.passes.find((p) => p.activity_id === stretchSourceActivityId) ?? null
    );
  }, [comparison]);

  const displayActivityId = resolveDisplayActivityId({
    selectedPassActivityId: stretchSourcePass?.activity_id,
    sourceActivityId: segmentEntity?.source_activity_id,
    selectedActivityId: null,
  });

  const activityTracks = useActivityTracks(comparison, displayActivityId);

  const displayPoints =
    displayActivityId != null ? activityTracks[displayActivityId] : undefined;
  const mapRoutes = useMapRoutes(displayActivityId, displayPoints);

  const pass = stretchSourcePass;

  const selectedStretch = useMemo(() => {
    if (ui.stretchIndex == null || !comparison) return null;
    return comparison.stretches.find((s) => s.index === ui.stretchIndex) ?? null;
  }, [comparison, ui.stretchIndex]);

  const referenceHighlight = useMemo(
    () => buildReferenceHighlight(null, comparison),
    [comparison],
  );
  const segmentHighlightPoints = useMemo(
    () =>
      buildSegmentHighlightPoints(null, displayPoints, pass, referenceHighlight),
    [displayPoints, pass, referenceHighlight],
  );
  const selectedPassStretchMetrics = useMemo(
    () => buildSelectedPassStretchMetrics(selectedStretch, pass, activityTracks),
    [selectedStretch, pass, activityTracks],
  );
  const stretchOverlays = useMemo(
    () =>
      buildStretchOverlays(null, comparison, segmentHighlightPoints, ui.stretchIndex),
    [comparison, segmentHighlightPoints, ui.stretchIndex],
  );

  const createReversedSegmentMutation = useCreateReversedSegmentMutation();
  const rescanSegmentMutation = useRescanSegmentMutation();
  const deleteSegmentMutation = useDeleteSegmentMutation();

  const handleReverseSegment = async (id: number, name: string): Promise<boolean> => {
    if (!segmentEntity) return false;
    const trimmed = name.trim();
    if (!trimmed) {
      const message = "Enter a name for the reversed segment.";
      setEditError(message);
      dispatch(shellActions.setActionError(message));
      return false;
    }

    dispatch(shellActions.clearActionError());
    setEditError(null);
    try {
      const segment = await createReversedSegmentMutation.mutateAsync({
        id,
        name: trimmed,
      });
      navigation.goSegment(segment.id);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setEditError(message);
      dispatch(shellActions.setActionError(message));
      return false;
    }
  };

  const handleRescan = async () => {
    if (!segmentEntity) return;
    dispatch(shellActions.clearActionError());
    try {
      await rescanSegmentMutation.mutateAsync(segmentEntity.id);
    } catch (err) {
      dispatch(
        shellActions.setActionError(err instanceof Error ? err.message : String(err)),
      );
    }
  };

  const handleDelete = async () => {
    if (!segmentEntity) return;
    if (!window.confirm(`Delete segment "${segmentEntity.name}"?`)) return;
    try {
      await deleteSegmentMutation.mutateAsync(segmentEntity.id);
      navigation.goHome();
    } catch (err) {
      dispatch(
        shellActions.setActionError(err instanceof Error ? err.message : String(err)),
      );
    }
  };

  return {
    segmentEntity,
    comparison,
    pass,
    selectedStretch,
    mapRoutes,
    segmentHighlightPoints,
    stretchOverlays,
    activityTracks,
    selectedPassStretchMetrics,
    stretchThresholds: comparison?.stretch_thresholds,
    stretchSourceActivityId: comparison?.stretch_source_activity_id ?? null,
    stretchCanSave,
    stretchState: comparison?.stretch_state ?? "unsaved",
    selectedStretchIndex: ui.stretchIndex,
    stretchSourcePassId: stretchSourcePass?.id ?? null,
    defaultStretchThresholds: profileThresholds,
    stretchLoading: compareQuery.isFetching || saveStretchesMutation.isPending,
    actionsLoading:
      createReversedSegmentMutation.isPending ||
      rescanSegmentMutation.isPending ||
      deleteSegmentMutation.isPending ||
      saveStretchesMutation.isPending,
    editError,
    handleReverseSegment,
    handleRescan,
    handleDelete,
    selectStretch: (stretch: Stretch) =>
      dispatchUi(segmentUiActions.toggleStretch(stretch.index)),
    clearStretchSelection: () => dispatchUi(segmentUiActions.clearStretchSelection()),
    resetStretchPreview: () => dispatchUi(segmentUiActions.clearStretchPreview()),
    previewStretchThresholds: (thresholds: StretchThresholds) => {
      ensureStretchBaseline();
      const currentSourceId =
        ui.stretchPreview?.stretchSourceActivityId ??
        comparison?.stretch_source_activity_id ??
        comparison?.segment.source_activity_id ??
        null;
      if (
        savedStretchBaseline &&
        currentSourceId != null &&
        currentSourceId === savedStretchBaseline.stretchSourceActivityId &&
        thresholdsEqual(savedStretchBaseline.thresholds, thresholds)
      ) {
        dispatchUi(segmentUiActions.clearStretchPreview());
        return;
      }
      dispatchUi(segmentUiActions.setStretchPreview(thresholds, currentSourceId));
    },
    setStretchSourceActivity: (activityId: number) => {
      ensureStretchBaseline();
      const thresholds =
        ui.stretchPreview?.thresholds ??
        comparison?.stretch_thresholds ??
        profileThresholds;
      if (
        savedStretchBaseline &&
        activityId === savedStretchBaseline.stretchSourceActivityId &&
        thresholdsEqual(savedStretchBaseline.thresholds, thresholds)
      ) {
        dispatchUi(segmentUiActions.clearStretchPreview());
        return;
      }
      dispatchUi(segmentUiActions.setStretchPreview(thresholds, activityId));
    },
    saveStretches: async () => {
      if (!comparison?.stretch_thresholds) return;
      await saveStretchesMutation.mutateAsync({
        segmentId,
        thresholds: comparison.stretch_thresholds,
        stretchSourceActivityId: comparison.stretch_source_activity_id,
      });
      dispatchUi(segmentUiActions.clearStretchPreview());
    },
  };
};