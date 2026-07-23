import { useEffect, useState } from "react";
import { activityDeleteLabel } from "../components/activities/ActivitiesPanel/activitiesPanelUtils";
import {
  fetchActivityDeleteInfo,
  useActivityQuery,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from "../queries/activities";
import type { ActivitySummary } from "../types";
import { useProfileContext } from "./ProfileContext";
import { shellActions } from "./appActions";
import { useAppWorkspace } from "./useAppWorkspaceContext";
import { useMapRoutes } from "./useMapRoutes";

export const useActivityScreen = (activityId: number) => {
  const { activities, dispatch, navigation } = useAppWorkspace();
  const { profiles } = useProfileContext();
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setEditError(null);
  }, [activityId]);

  const activityEntity = activities.find((a) => a.id === activityId) ?? null;
  const activityQuery = useActivityQuery(activityId);
  const displayPoints = activityQuery.data?.points;
  const mapRoutes = useMapRoutes(activityId, displayPoints);

  const updateActivityMutation = useUpdateActivityMutation();
  const deleteActivityMutation = useDeleteActivityMutation();

  const handleSaveEdit = async (id: number, name: string, profileId: number): Promise<boolean> => {
    if (!activityEntity) return false;
    const payload: { name?: string; profile_id?: number } = {};
    if (name !== activityEntity.name) payload.name = name;
    if (profileId !== activityEntity.profile_id) payload.profile_id = profileId;
    if (Object.keys(payload).length === 0) return true;

    dispatch(shellActions.clearActionError());
    setEditError(null);
    try {
      await updateActivityMutation.mutateAsync({ id, ...payload });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setEditError(message);
      dispatch(shellActions.setActionError(message));
      return false;
    }
  };

  const handleDelete = async (activity: ActivitySummary) => {
    dispatch(shellActions.clearActionError());
    try {
      const info = await fetchActivityDeleteInfo(activity.id);
      let message = `Delete this activity?\n\n${activityDeleteLabel(activity)}`;
      if (info.segment_count > 0) {
        const names = info.segments.map((s) => s.name).join(", ");
        message = `This activity is the source for ${info.segment_count} segment(s): ${names}.\n\n${activityDeleteLabel(activity)}\n\nDelete the activity and all those segments?`;
      }
      if (!window.confirm(message)) return;

      await deleteActivityMutation.mutateAsync(activity.id);
      navigation.goHome();
    } catch (err) {
      dispatch(
        shellActions.setActionError(err instanceof Error ? err.message : String(err)),
      );
    }
  };

  return {
    activityEntity,
    trackPoints: displayPoints,
    mapRoutes,
    editError,
    actionLoading: updateActivityMutation.isPending || deleteActivityMutation.isPending,
    handleSaveEdit,
    handleDelete,
    profiles,
  };
};