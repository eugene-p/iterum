import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  compareSegment,
  createReversedSegment,
  createSegment,
  deleteSegment,
  getSegmentReference,
  listSegments,
  rescanSegment,
  saveSegmentStretches,
  updateSegment,
} from "../api";
import type {
  ProfileViewScope,
  SegmentStretchPreviewOptions,
  Stretch,
  StretchThresholds,
} from "../types";
import { queryKeys } from "./queryKeys";

export const useSegmentsQuery = (profileScope?: ProfileViewScope) =>
  useQuery({
    queryKey: queryKeys.segments(profileScope),
    queryFn: () => listSegments(profileScope),
  });

export const useSegmentReferenceQuery = (segmentId: number) =>
  useQuery({
    queryKey: queryKeys.segmentReference(segmentId),
    queryFn: () => getSegmentReference(segmentId),
    staleTime: 5 * 60 * 1000,
  });

export const useSegmentCompareQuery = (
  segmentId: number | null,
  preview: SegmentStretchPreviewOptions | null = null,
  enabled = true,
) =>
  useQuery({
    queryKey:
      segmentId != null
        ? queryKeys.segmentCompare(segmentId, preview)
        : ["segment-compare", "idle"],
    queryFn: () => compareSegment(segmentId!, preview),
    enabled: enabled && segmentId != null,
  });

export const useSaveSegmentStretchesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      segmentId,
      thresholds,
      stretchSourceActivityId,
      stretches,
    }: {
      segmentId: number;
      thresholds: StretchThresholds;
      stretchSourceActivityId?: number | null;
      stretches?: Stretch[] | null;
    }) => saveSegmentStretches(segmentId, thresholds, stretchSourceActivityId, stretches),
    onSuccess: (result, { segmentId }) => {
      queryClient.setQueriesData(
        { queryKey: queryKeys.segmentCompareRoot(segmentId) },
        result,
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentCompareRoot(segmentId) });
    },
  });
};

export const useInvalidateSegments = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.segmentsRoot });
};

export const useInvalidateSegmentCompare = () => {
  const queryClient = useQueryClient();
  return (segmentId: number) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.segmentCompareRoot(segmentId) });
};

type CreateSegmentPayload = Parameters<typeof createSegment>[0];
type UpdateSegmentPayload = { id: number; payload: Parameters<typeof updateSegment>[1] };

export const useCreateSegmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSegmentPayload) => createSegment(payload),
    onSuccess: (segment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentCompareRoot(segment.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityMatchedSegmentsRoot });
    },
  });
};

export const useUpdateSegmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: UpdateSegmentPayload) => updateSegment(id, payload),
    onSuccess: (segment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentCompareRoot(segment.id) });
    },
  });
};

export const useDeleteSegmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSegment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityMatchedSegmentsRoot });
    },
  });
};

export const useRescanSegmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rescanSegment(id),
    onSuccess: (_result, segmentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentCompareRoot(segmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityMatchedSegmentsRoot });
    },
  });
};

export const useCreateReversedSegmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => createReversedSegment(id, name),
    onSuccess: (segment) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.segmentCompareRoot(segment.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityMatchedSegmentsRoot });
    },
  });
};