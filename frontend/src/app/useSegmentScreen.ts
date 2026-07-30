import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  buildReferenceHighlight,
  buildSegmentHighlightPoints,
  buildSelectedPassStretchMetrics,
  buildStretchOverlays,
} from "../lib/mapHighlights";
import {
  useCreateReversedSegmentMutation,
  useCreateSegmentMutation,
  useDeleteSegmentMutation,
  useRescanSegmentMutation,
  useSaveSegmentStretchesMutation,
  useSegmentCompareQuery,
} from "../queries/segments";
import type { Stretch, StretchThresholds } from "../types";
import {
  DEFAULT_STRETCH_THRESHOLDS,
  isStretchPreviewDirty,
  stretchKindLabel,
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
import { useStretchEditSession } from "../hooks/useStretchEditSession";
export const useSegmentScreen = (segmentId: number) => {
  const { segments, dispatch, navigation } = useAppWorkspace();
  const { profileStretchDefaults } = useProfileContext();
  const profileThresholds = profileStretchDefaults ?? DEFAULT_STRETCH_THRESHOLDS;
  const [ui, dispatchUi] = useReducer(segmentUiReducer, initialSegmentUiState);
  const [editError, setEditError] = useState<string | null>(null);
  const [savedStretchBaseline, setSavedStretchBaseline] =
    useState<SavedStretchBaseline | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertName, setConvertName] = useState("");

  useEffect(() => {
    dispatchUi({ type: SEGMENT_UI_ACTION_TYPES.RESET });
    setEditError(null);
    setSavedStretchBaseline(null);
    setConvertOpen(false);
    setConvertName("");
  }, [segmentId]);

  const segmentEntity = segments.find((s) => s.id === segmentId) ?? null;

  const compareQuery = useSegmentCompareQuery(segmentId, ui.stretchPreview, true);
  const comparison = compareQuery.data ?? null;
  const saveStretchesMutation = useSaveSegmentStretchesMutation();
  const createSegmentMutation = useCreateSegmentMutation();

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

  const thresholdCanSave = useMemo(() => {
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

  const savedStretches = comparison?.stretches ?? [];
  const referenceHighlight = useMemo(
    () => buildReferenceHighlight(null, comparison),
    [comparison],
  );
  const segmentHighlightPoints = useMemo(
    () =>
      buildSegmentHighlightPoints(null, displayPoints, pass, referenceHighlight),
    [displayPoints, pass, referenceHighlight],
  );

  const pathPoints = useMemo(() => {
    if (segmentHighlightPoints.length >= 2) return segmentHighlightPoints;
    if (comparison?.reference_points?.length) return comparison.reference_points;
    return displayPoints;
  }, [segmentHighlightPoints, comparison, displayPoints]);

  const persistManualStretches = useCallback(
    async (stretches: Stretch[]) => {
      const thresholds =
        comparison?.stretch_thresholds ?? profileThresholds;
      if (!thresholds) {
        throw new Error("Missing stretch thresholds; cannot save geometry.");
      }
      await saveStretchesMutation.mutateAsync({
        segmentId,
        thresholds,
        stretchSourceActivityId: comparison?.stretch_source_activity_id,
        stretches,
      });
      if (ui.stretchPreview) {
        dispatchUi(segmentUiActions.clearStretchPreview());
      }
    },
    [
      comparison,
      segmentId,
      saveStretchesMutation,
      profileThresholds,
      ui.stretchPreview,
    ],
  );

  const stretchEdit = useStretchEditSession({
    segmentId,
    savedStretches,
    pathPoints,
    thresholds: comparison?.stretch_thresholds ?? profileThresholds,
    selectedIndex: ui.stretchIndex,
    onSelectIndex: (index) => {
      if (index == null) dispatchUi(segmentUiActions.clearStretchSelection());
      else dispatchUi(segmentUiActions.selectStretch(index));
    },
    onPersist: persistManualStretches,
  });

  const selectedStretch = useMemo(() => {
    if (ui.stretchIndex == null) return null;
    // Prefer array position (edit session is 0-based); fall back to stretch.index.
    return (
      stretchEdit.stretches[ui.stretchIndex] ??
      stretchEdit.stretches.find((s) => s.index === ui.stretchIndex) ??
      null
    );
  }, [stretchEdit.stretches, ui.stretchIndex]);

  const selectedPassStretchMetrics = useMemo(
    () => buildSelectedPassStretchMetrics(selectedStretch, pass, activityTracks),
    [selectedStretch, pass, activityTracks],
  );
  const stretchOverlays = useMemo(
    () =>
      buildStretchOverlays(
        null,
        comparison,
        segmentHighlightPoints,
        ui.stretchIndex,
        stretchEdit.stretches,
      ),
    [comparison, segmentHighlightPoints, ui.stretchIndex, stretchEdit.stretches],
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

  const openConvert = () => {
    if (stretchEdit.dirty || selectedStretch == null || !segmentEntity) return;
    setConvertName(
      `${segmentEntity.name} · ${stretchKindLabel(selectedStretch.kind)} #${selectedStretch.index + 1}`,
    );
    setConvertOpen(true);
  };

  const confirmConvert = async () => {
    if (!selectedStretch || !segmentEntity) return;
    const name = convertName.trim();
    if (!name) return;
    // Indices 0/0 are intentionally invalid so the server resolves from lat/lon
    // on the full source activity track (path points here may be a pass slice).
    const sourceActivityId =
      comparison?.stretch_source_activity_id ?? segmentEntity.source_activity_id;
    try {
      setEditError(null);
      await createSegmentMutation.mutateAsync({
        name,
        source_activity_id: sourceActivityId,
        start_index: 0,
        end_index: 0,
        start_lat: selectedStretch.start.lat,
        start_lon: selectedStretch.start.lon,
        end_lat: selectedStretch.end.lat,
        end_lon: selectedStretch.end.lon,
        radius_m: segmentEntity.radius_m,
        match_threshold: segmentEntity.match_threshold,
      });
      setConvertOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err));
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
    stretchCanSave: stretchEdit.dirty || thresholdCanSave,
    stretchState: stretchEdit.dirty
      ? ("preview" as const)
      : (comparison?.stretch_state ?? "unsaved"),
    selectedStretchIndex: ui.stretchIndex,
    stretchSourcePassId: stretchSourcePass?.id ?? null,
    defaultStretchThresholds: profileThresholds,
    stretchLoading:
      compareQuery.isFetching ||
      saveStretchesMutation.isPending ||
      stretchEdit.saving,
    stretchEdit,
    displayStretches: stretchEdit.stretches,
    convertOpen,
    convertName,
    convertBusy: createSegmentMutation.isPending,
    setConvertName,
    openConvert,
    closeConvert: () => setConvertOpen(false),
    confirmConvert: () => void confirmConvert(),
    actionsLoading:
      createReversedSegmentMutation.isPending ||
      rescanSegmentMutation.isPending ||
      deleteSegmentMutation.isPending ||
      saveStretchesMutation.isPending ||
      createSegmentMutation.isPending,
    editError,
    handleReverseSegment,
    handleRescan,
    handleDelete,
    selectStretch: (stretch: Stretch) => {
      const arrayIndex = stretchEdit.stretches.indexOf(stretch);
      const index =
        arrayIndex >= 0
          ? arrayIndex
          : stretchEdit.stretches.findIndex((s) => s.index === stretch.index);
      if (index < 0) return;
      dispatchUi(segmentUiActions.selectStretch(index));
    },
    /** Toggle selection off if already selected (list click behavior). */
    toggleStretch: (stretch: Stretch) => {
      const arrayIndex = stretchEdit.stretches.indexOf(stretch);
      const index =
        arrayIndex >= 0
          ? arrayIndex
          : stretchEdit.stretches.findIndex((s) => s.index === stretch.index);
      if (index < 0) return;
      dispatchUi(segmentUiActions.toggleStretch(index));
    },
    clearStretchSelection: () => {
      dispatchUi(segmentUiActions.clearStretchSelection());
    },
    resetStretchPreview: () => {
      if (stretchEdit.dirty) {
        stretchEdit.cancel();
        return;
      }
      dispatchUi(segmentUiActions.clearStretchPreview());
    },
    previewStretchThresholds: (thresholds: StretchThresholds) => {
      if (stretchEdit.dirty) return;
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
      if (stretchEdit.dirty) return;
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
      if (stretchEdit.dirty) {
        try {
          await stretchEdit.save();
          setEditError(null);
        } catch (err) {
          setEditError(err instanceof Error ? err.message : String(err));
        }
        return;
      }
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