import { useCallback, useEffect, useMemo, useState } from "react";
import { pinViewportScroll } from "../lib/pinViewportScroll";
import { buildFullPassMetrics, buildStretchPassMetricsForStretch } from "../lib/mapHighlights";
import type { SegmentCompare, SegmentPass, Stretch, TrackPoint } from "../types";
import type { AppLocation, AppSearchParams } from "./appRoutes";
import {
  excludeComparePass,
  parseAppSearchParams,
  replaceComparePassesInUrl,
  resolveSelectedPassIds,
  setComparePassIncluded,
} from "./appRoutes";

type UseSegmentPassSelectionOptions = {
  segmentId: number;
  comparison: SegmentCompare | null;
  selectedStretch: Stretch | null;
  activityTracks: Record<number, TrackPoint[]>;
  pathname: string;
  location: AppLocation;
  searchParams: AppSearchParams;
};

export const useSegmentPassSelection = ({
  segmentId,
  comparison,
  selectedStretch,
  activityTracks,
  pathname,
  location,
  searchParams,
}: UseSegmentPassSelectionOptions) => {
  const matchedPassIds = useMemo(
    () => (comparison?.passes ?? []).filter((pass) => pass.matched).map((pass) => pass.id),
    [comparison],
  );

  const [selectedPassIds, setSelectedPassIds] = useState<ReadonlyArray<number>>([]);

  useEffect(() => {
    const params = parseAppSearchParams(window.location.search);
    setSelectedPassIds(resolveSelectedPassIds(params.comparePasses, matchedPassIds));
  }, [segmentId, matchedPassIds]);

  useEffect(() => {
    const syncFromHistory = () => {
      const params = parseAppSearchParams(window.location.search);
      setSelectedPassIds(resolveSelectedPassIds(params.comparePasses, matchedPassIds));
    };
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, [matchedPassIds]);

  const applyPassSelection = useCallback(
    (nextSelected: ReadonlyArray<number>) => {
      setSelectedPassIds(nextSelected);
      replaceComparePassesInUrl(
        pathname,
        searchParams,
        location,
        nextSelected,
        matchedPassIds,
      );
      pinViewportScroll();
      requestAnimationFrame(pinViewportScroll);
    },
    [pathname, searchParams, location, matchedPassIds],
  );

  const includedPassIdSet = useMemo(() => new Set(selectedPassIds), [selectedPassIds]);

  const includedPasses = useMemo(() => {
    const matched = (comparison?.passes ?? []).filter((pass) => pass.matched);
    if (!includedPassIdSet.size) return matched;
    return matched.filter((pass) => includedPassIdSet.has(pass.id));
  }, [comparison?.passes, includedPassIdSet]);

  const fullPassMetrics = useMemo(
    () => buildFullPassMetrics(includedPasses),
    [includedPasses],
  );

  const stretchPassMetrics = useMemo(
    () => buildStretchPassMetricsForStretch(selectedStretch, includedPasses, activityTracks),
    [selectedStretch, includedPasses, activityTracks],
  );

  const setPassIncluded = useCallback(
    (pass: SegmentPass, included: boolean) => {
      const next = setComparePassIncluded(
        selectedPassIds,
        matchedPassIds,
        pass.id,
        included,
      );
      if (next === null && !included) return;
      applyPassSelection(next ?? matchedPassIds);
    },
    [selectedPassIds, matchedPassIds, applyPassSelection],
  );

  const excludePass = useCallback(
    (pass: SegmentPass) => {
      const next = excludeComparePass(selectedPassIds, pass.id);
      if (next === null) return;
      applyPassSelection(next);
    },
    [selectedPassIds, applyPassSelection],
  );

  return {
    selectedPassIds,
    includedPassIdSet,
    fullPassMetrics,
    stretchPassMetrics,
    setPassIncluded,
    excludePass,
    applyPassSelection,
  };
};