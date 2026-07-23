import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteActivity,
  getActivityDetail,
  getActivityDeleteInfo,
  getActivityMatchedSegments,
  listActivities,
  updateActivity,
  uploadActivity,
} from "../api";
import type { ProfileViewScope } from "../types";
import { queryKeys } from "./queryKeys";

export const useActivitiesQuery = (profileScope?: ProfileViewScope) =>
  useQuery({
    queryKey: queryKeys.activities(profileScope),
    queryFn: () => listActivities(profileScope),
  });

export const useActivityQuery = (activityId: number | null) =>
  useQuery({
    queryKey: queryKeys.activity(activityId ?? 0),
    queryFn: () => getActivityDetail(activityId!),
    enabled: activityId != null,
  });

export const useActivityMatchedSegmentsQuery = (activityId: number) =>
  useQuery({
    queryKey: queryKeys.activityMatchedSegments(activityId),
    queryFn: () => getActivityMatchedSegments(activityId),
    staleTime: 60 * 1000,
  });

export const useInvalidateActivities = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["activities"] });
};

export const useUpdateActivityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      profile_id,
    }: {
      id: number;
      name?: string;
      profile_id?: number;
    }) => updateActivity(id, { name, profile_id }),
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(activity.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityMatchedSegments(activity.id) });
    },
  });
};

export const useDeleteActivityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["segments"] });
    },
  });
};

export const useUploadActivityMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, profileId }: { file: File; profileId: number }) =>
      uploadActivity(file, profileId),
    onSuccess: (activity) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(activity.id) });
      queryClient.invalidateQueries({ queryKey: ["activity-matched-segments"] });
    },
  });
};

export const fetchActivityDeleteInfo = (activityId: number) =>
  getActivityDeleteInfo(activityId);