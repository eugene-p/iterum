import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProfile, deleteProfile, listProfiles, updateProfile } from "../api";
import type { Profile, StretchThresholds } from "../types";
import { queryKeys } from "./queryKeys";

export const useProfilesQuery = () =>
  useQuery({
    queryKey: queryKeys.profiles,
    queryFn: listProfiles,
  });

export const useInvalidateProfiles = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
};

export const useCreateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
    },
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      year_of_birth,
      default_stretch_thresholds,
    }: {
      id: number;
      name?: string;
      year_of_birth?: number | null;
      default_stretch_thresholds?: StretchThresholds;
    }) => updateProfile(id, { name, year_of_birth, default_stretch_thresholds }),
    onSuccess: (profile: Profile) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(profile.id) });
    },
  });
};

export const useDeleteProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};