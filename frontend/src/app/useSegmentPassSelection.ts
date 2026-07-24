import { useCallback, useEffect, useMemo, useState } from "react";
import { pinViewportScroll } from "../lib/pinViewportScroll";
import { buildFullPassMetrics, buildStretchPassMetricsForStretch } from "../lib/mapHighlights";
import { defaultSelectedPassIds } from "../lib/defaultSelectedPasses";
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
  const matchedPasses = useMemo(
    () => (comparison?.passes ?? []).filter((pass) => pass.matched),
    [comparison],
  );
  const matchedPassIds = useMemo(
    () => matchedPasses.map((pass) => pass.id),
    [matchedPasses],
  );
  const defaultPassIds = useMemo(
    () => defaultSelectedPassIds(matchedPasses),
    [matchedPasses],
  );

  const [selectedPassIds, setSelectedPassIds] = useState<ReadonlyArray<number>>([]);

  useEffect(() => {
    const params = parseAppSearchParams(window.location.search);
    setSelectedPassIds(
      resolveSelectedPassIds(params.comparePasses, matchedPassIds, defaultPassIds),
    );
  }, [segmentId, matchedPassIds, defaultPassIds]);

  useEffect(() => {
    const syncFromHistory = () => {
      const params = parseAppSearchParams(window.location.search);
      setSelectedPassIds(
        resolveSelectedPassIds(params.comparePasses, matchedPassIds, defaultPassIds),
      );
    };
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, [matchedPassIds, defaultPassIds]);

  const applyPassSelection = useCallback(
    (nextSelected: ReadonlyArray<number>) => {
      setSelectedPassIds(nextSelected);
      replaceComparePassesInUrl(
        pathname,
        searchParams,
        location,
        nextSelected,
        matchedPassIds,
        defaultPassIds,
      );
      pinViewportScroll();
      requestAnimationFrame(pinViewportScroll);
    },
    [pathname, searchParams, location, matchedPassIds, defaultPassIds],
  );

  const includedPassIdSet = useMemo(() => {
    if (selectedPassIds.length > 0) return new Set(selectedPassIds);
    // Before the URL/effect sync runs, treat empty as the smart default — not all matches.
    return new Set(defaultPassIds);
  }, [selectedPassIds, defaultPassIds]);

  const includedPasses = useMemo(
    () => matchedPasses.filter((pass) => includedPassIdSet.has(pass.id)),
    [matchedPasses, includedPassIdSet],
  );

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
      applyPassSelection(next ?? defaultPassIds);
    },
    [selectedPassIds, matchedPassIds, defaultPassIds, applyPassSelection],
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