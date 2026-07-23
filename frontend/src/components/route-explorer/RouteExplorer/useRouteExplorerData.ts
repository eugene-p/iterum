import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getActivityDetail } from "../../../api";
import { resolveSelectedPassIds, setComparePassIncluded } from "../../../app/appRoutes";
import { queryKeys } from "../../../queries/queryKeys";
import type { SegmentCompare, SegmentPass, TrackPoint } from "../../../types";
import { routeExplorerTargetKey, type RouteExplorerTarget } from "./RouteExplorerTarget";

type RouteExplorerDataOptions = {
  selectedPassIds?: ReadonlyArray<number> | null;
  onSelectedPassIdsChange?: (ids: ReadonlyArray<number>) => void;
};

export const useRouteExplorerData = (
  target: RouteExplorerTarget,
  options: RouteExplorerDataOptions = {},
) => {
  const { selectedPassIds: controlledSelectedPassIds, onSelectedPassIdsChange } = options;
  const [localSelectedPassIds, setLocalSelectedPassIds] = useState<ReadonlyArray<number>>([]);

  const isActivity = target.kind === "activity";
  const comparison: SegmentCompare | null = target.kind === "segment" ? target.comparison : null;
  const isPassSelectionControlled = onSelectedPassIdsChange != null;
  const targetKey = routeExplorerTargetKey(target);

  const matchedPasses = useMemo(
    () => (comparison?.passes ?? []).filter((p) => p.matched),
    [comparison],
  );
  const matchedPassIds = useMemo(() => matchedPasses.map((pass) => pass.id), [matchedPasses]);

  const activityIds = useMemo(() => {
    if (target.kind === "activity") return [target.activityId];
    if (!comparison) return [];
    return [
      ...new Set([
        comparison.segment.source_activity_id,
        ...matchedPasses.map((pass) => pass.activity_id),
      ]),
    ];
  }, [target, comparison, matchedPasses]);

  const queries = useQueries({
    queries: activityIds.map((id) => ({
      queryKey: queryKeys.activity(id),
      queryFn: () => getActivityDetail(id),
    })),
  });

  // Stabilize memo deps: useQueries returns a new array identity each render.
  const queryDataSignature = queries
    .map((query) => `${query.dataUpdatedAt}:${query.data?.id ?? ""}`)
    .join("|");
  const loading = queries.some((query) => query.isLoading);
  const queryError = queries.find((query) => query.error)?.error;
  const error =
    queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const passTracks = useMemo(() => {
    const tracks: Record<number, TrackPoint[]> = {};
    for (const query of queries) {
      if (query.data) tracks[query.data.id] = query.data.points ?? [];
    }
    return tracks;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queries identity is unstable; signature tracks data
  }, [queryDataSignature]);

  const activityQueryData = target.kind === "activity" ? queries[0]?.data : null;
  const activityPoints = activityQueryData?.points ?? [];
  const activityDurationSec = activityQueryData?.duration_sec ?? null;
  const activityProfileId = activityQueryData?.profile_id ?? null;
  const activityDateTime = activityQueryData
    ? {
        started_at: activityQueryData.started_at,
        created_at: activityQueryData.created_at,
        name: activityQueryData.name,
        source_filename: activityQueryData.source_filename,
      }
    : null;

  const selectedPassIds = useMemo(() => {
    if (isPassSelectionControlled) {
      return resolveSelectedPassIds(controlledSelectedPassIds ?? null, matchedPassIds);
    }
    return localSelectedPassIds;
  }, [
    isPassSelectionControlled,
    controlledSelectedPassIds,
    matchedPassIds,
    localSelectedPassIds,
  ]);

  const selectedPassIdSet = useMemo(() => new Set(selectedPassIds), [selectedPassIds]);

  useEffect(() => {
    if (!isPassSelectionControlled && comparison) {
      setLocalSelectedPassIds(matchedPassIds);
    }
  }, [targetKey, isPassSelectionControlled, comparison, matchedPassIds]);

  const setPassIncluded = useCallback(
    (pass: SegmentPass, included: boolean) => {
      const next = setComparePassIncluded(selectedPassIds, matchedPassIds, pass.id, included);
      if (next === null && !included) return;
      const resolved = next ?? matchedPassIds;
      if (onSelectedPassIdsChange) onSelectedPassIdsChange(resolved);
      else setLocalSelectedPassIds(resolved);
    },
    [selectedPassIds, matchedPassIds, onSelectedPassIdsChange],
  );

  return {
    loading,
    error,
    isActivity,
    comparison,
    matchedPasses,
    activityPoints,
    activityDurationSec,
    activityProfileId,
    activityDateTime,
    passTracks,
    selectedPassIds: selectedPassIdSet,
    setPassIncluded,
  };
};