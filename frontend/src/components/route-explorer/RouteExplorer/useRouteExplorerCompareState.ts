import { useEffect, useMemo, useState } from "react";
import {
  indexAtElapsedSec,
  maxDurationAmongSlices,
  metricsAtIndex,
  timeSliderStep,
  type ExplorerPassSlice,
} from "../../../routeExplorerUtils";
import {
  APP_COMPARE_MODE,
  APP_VIEW,
  resolveCompareMode,
  type CompareMode,
} from "../../../app/appRoutes";
import { buildStretchOverlays } from "../../../lib/mapHighlights";
import {
  segmentFractionAtIndex,
  stretchAtFraction,
  stretchPointContextAtIndex,
  stretchProgressScore,
} from "../../../stretchUtils";
import type { SegmentCompare, SegmentPass, Stretch, TrackPoint } from "../../../types";
import { SOLO_ACTIVITY_COLOR } from "../passIdentityColors";
import { routeExplorerTargetKey, type RouteExplorerTarget } from "./RouteExplorerTarget";
import {
  assignStretchProgressColors,
  stretchProgressColorForValue,
} from "./stretchProgressRows";
import {
  buildSegmentTimePassRows,
  buildStretchTimePassRows,
  markersFromPassRows,
  soloActivityMarker,
} from "./comparePassRows";
import {
  indexAtStretchElapsedSec,
  slicePointsForStretch,
  stretchDurationsSec,
  virtualAtStretchStart,
  virtualMaxSec,
  virtualToStretchPosition,
} from "./stretchCompareUtils";

type UseRouteExplorerCompareStateOptions = {
  target: RouteExplorerTarget;
  isActivity: boolean;
  comparison: SegmentCompare | null;
  matchedPasses: SegmentPass[];
  activityPoints: TrackPoint[];
  activityDurationSec: number | null;
  passSlices: ExplorerPassSlice[];
  compareMode?: CompareMode | null;
  selectedPassIds?: ReadonlyArray<number> | null;
  onCompareModeChange?: (mode: CompareMode) => void;
};

export const useRouteExplorerCompareState = ({
  target,
  isActivity,
  comparison,
  matchedPasses,
  activityPoints,
  activityDurationSec,
  passSlices,
  compareMode = null,
  selectedPassIds = null,
  onCompareModeChange,
}: UseRouteExplorerCompareStateOptions) => {
  const [positionIndex, setPositionIndex] = useState(0);
  const [segmentElapsedSec, setSegmentElapsedSec] = useState(0);
  const [stretchVirtualSec, setStretchVirtualSec] = useState(0);
  const [localCompareMode, setLocalCompareMode] = useState<CompareMode>(APP_COMPARE_MODE.SEGMENT);
  const isCompareModeControlled = onCompareModeChange != null;
  const targetKey = routeExplorerTargetKey(target);

  const referencePoints = useMemo(
    () => comparison?.reference_points ?? [],
    [comparison?.reference_points],
  );

  const referenceDurationSec = useMemo(() => {
    if (!comparison) return null;
    const sourcePass = comparison.passes.find(
      (p) => p.activity_id === comparison.segment.source_activity_id && p.matched,
    );
    return sourcePass?.duration_sec ?? null;
  }, [comparison]);

  const stretches = useMemo(() => comparison?.stretches ?? [], [comparison?.stretches]);

  useEffect(() => {
    setPositionIndex(0);
    setSegmentElapsedSec(0);
    setStretchVirtualSec(0);
  }, [targetKey]);

  const maxSegmentTimeSec = useMemo(() => {
    if (isActivity) {
      const duration = metricsAtIndex(
        activityPoints,
        activityPoints.length - 1,
        activityDurationSec,
      )?.elapsedSec;
      return duration ?? 0;
    }
    return maxDurationAmongSlices(passSlices);
  }, [isActivity, activityPoints, activityDurationSec, passSlices]);

  const stretchDurationList = useMemo(
    () => stretchDurationsSec(passSlices, stretches),
    [passSlices, stretches],
  );

  const stretchVirtualMax = useMemo(
    () => virtualMaxSec(stretchDurationList),
    [stretchDurationList],
  );

  const segmentTimeAvailable = !isActivity && maxSegmentTimeSec > 0;
  const stretchTimeAvailable = !isActivity && stretches.length > 0 && stretchVirtualMax > 0;

  const activeTab = isCompareModeControlled
    ? resolveCompareMode(
        {
          view: APP_VIEW.COMPARE,
          compareMode,
          comparePasses: selectedPassIds,
          activityId: null,
          passNumber: null,
        },
        { segmentTimeAvailable, stretchTimeAvailable },
      )
    : localCompareMode;

  const setActiveTab = (mode: CompareMode) => {
    if (onCompareModeChange) onCompareModeChange(mode);
    else setLocalCompareMode(mode);
  };

  useEffect(() => {
    if (segmentElapsedSec > maxSegmentTimeSec) setSegmentElapsedSec(maxSegmentTimeSec);
  }, [maxSegmentTimeSec, segmentElapsedSec]);

  useEffect(() => {
    if (stretchVirtualSec > stretchVirtualMax) setStretchVirtualSec(stretchVirtualMax);
  }, [stretchVirtualMax, stretchVirtualSec]);

  useEffect(() => {
    if (activeTab === APP_COMPARE_MODE.STRETCH && !stretchTimeAvailable) {
      if (onCompareModeChange) onCompareModeChange(APP_COMPARE_MODE.SEGMENT);
      else setLocalCompareMode(APP_COMPARE_MODE.SEGMENT);
    }
  }, [stretchTimeAvailable, activeTab, onCompareModeChange]);

  const showActivityScrub = isActivity;
  const showSegmentTime =
    !isActivity && segmentTimeAvailable && activeTab === APP_COMPARE_MODE.SEGMENT;
  const showStretchTime =
    !isActivity && stretchTimeAvailable && activeTab === APP_COMPARE_MODE.STRETCH;

  const stretchPos = useMemo(
    () => virtualToStretchPosition(stretchVirtualSec, stretchDurationList),
    [stretchVirtualSec, stretchDurationList],
  );

  const currentStretch: Stretch | null = useMemo(() => {
    if (!showStretchTime || !stretches.length) return null;
    return stretches[stretchPos.stretchIndex] ?? null;
  }, [showStretchTime, stretches, stretchPos.stretchIndex]);

  const localStretchElapsed = stretchPos.localElapsedSec;
  const localStretchMax = stretchDurationList[stretchPos.stretchIndex] ?? 0;

  const positionFraction = useMemo(() => {
    if (activityPoints.length <= 1) return 0;
    return positionIndex / (activityPoints.length - 1);
  }, [activityPoints.length, positionIndex]);

  const referenceIndexAtSegmentTime = useMemo(() => {
    if (!showSegmentTime || !referencePoints.length) return 0;
    return indexAtElapsedSec(referencePoints, segmentElapsedSec, referenceDurationSec);
  }, [showSegmentTime, referencePoints, segmentElapsedSec, referenceDurationSec]);

  const referenceIndexAtStretchTime = useMemo(() => {
    if (!showStretchTime || !referencePoints.length || !currentStretch) return 0;
    return indexAtStretchElapsedSec(
      referencePoints,
      currentStretch,
      localStretchElapsed,
      referenceDurationSec,
    );
  }, [
    showStretchTime,
    referencePoints,
    currentStretch,
    localStretchElapsed,
    referenceDurationSec,
  ]);

  const segmentCurrentStretch = useMemo((): Stretch | null => {
    if (!showSegmentTime || !stretches.length || !referencePoints.length) return null;
    const fraction =
      referencePoints.length <= 1
        ? 0
        : referenceIndexAtSegmentTime / (referencePoints.length - 1);
    return stretchAtFraction(stretches, referencePoints, fraction);
  }, [showSegmentTime, stretches, referencePoints, referenceIndexAtSegmentTime]);

  const activityMetrics = useMemo(
    () =>
      showActivityScrub
        ? metricsAtIndex(activityPoints, positionIndex, activityDurationSec)
        : null,
    [showActivityScrub, activityPoints, positionIndex, activityDurationSec],
  );

  const segmentPassRowsBase = useMemo(() => {
    if (!showSegmentTime) return [];
    return buildSegmentTimePassRows(passSlices, segmentElapsedSec, stretches, matchedPasses);
  }, [showSegmentTime, passSlices, segmentElapsedSec, stretches, matchedPasses]);

  const segmentPassRows = useMemo(
    () => assignStretchProgressColors(segmentPassRowsBase, stretches, "segment"),
    [segmentPassRowsBase, stretches],
  );

  const stretchPassRowsBase = useMemo(() => {
    if (!showStretchTime || !currentStretch) return [];
    return buildStretchTimePassRows(
      passSlices,
      currentStretch,
      localStretchElapsed,
      matchedPasses,
    );
  }, [showStretchTime, currentStretch, passSlices, localStretchElapsed, matchedPasses]);

  const stretchPassRows = useMemo(
    () => assignStretchProgressColors(stretchPassRowsBase, stretches, "stretch"),
    [stretchPassRowsBase, stretches],
  );

  const segmentReferenceMetrics = useMemo(() => {
    if (!showSegmentTime || !referencePoints.length) return null;
    return metricsAtIndex(referencePoints, referenceIndexAtSegmentTime, referenceDurationSec);
  }, [showSegmentTime, referencePoints, referenceIndexAtSegmentTime, referenceDurationSec]);

  const stretchReferenceMetrics = useMemo(() => {
    if (!showStretchTime || !referencePoints.length) return null;
    return metricsAtIndex(referencePoints, referenceIndexAtStretchTime, referenceDurationSec);
  }, [showStretchTime, referencePoints, referenceIndexAtStretchTime, referenceDurationSec]);

  const segmentReferenceStretchContext = useMemo(() => {
    if (!showSegmentTime || !referencePoints.length) return null;
    return stretchPointContextAtIndex(
      referencePoints,
      segmentCurrentStretch,
      referenceIndexAtSegmentTime,
      referenceDurationSec,
    );
  }, [
    showSegmentTime,
    referencePoints,
    segmentCurrentStretch,
    referenceIndexAtSegmentTime,
    referenceDurationSec,
  ]);

  const stretchReferenceStretchContext = useMemo(() => {
    if (!showStretchTime || !referencePoints.length || !currentStretch) return null;
    return stretchPointContextAtIndex(
      referencePoints,
      currentStretch,
      referenceIndexAtStretchTime,
      referenceDurationSec,
    );
  }, [
    showStretchTime,
    referencePoints,
    currentStretch,
    referenceIndexAtStretchTime,
    referenceDurationSec,
  ]);

  const segmentReferencePositionColor = useMemo(() => {
    if (!showSegmentTime || !stretches.length) return null;
    const fraction =
      referencePoints.length <= 1
        ? 0
        : referenceIndexAtSegmentTime / (referencePoints.length - 1);
    const referenceScore = stretchProgressScore(stretches, referencePoints, fraction);
    const peerScores = segmentPassRowsBase.map((row) =>
      stretchProgressScore(
        stretches,
        row.slice.points,
        segmentFractionAtIndex(row.slice.points, row.index),
      ),
    );
    return stretchProgressColorForValue(referenceScore, peerScores, "segment");
  }, [
    showSegmentTime,
    stretches,
    referencePoints,
    referenceIndexAtSegmentTime,
    segmentPassRowsBase,
  ]);

  const stretchReferencePositionColor = useMemo(() => {
    if (!showStretchTime) return null;
    const referenceLocal =
      stretchReferenceStretchContext?.stretchElapsedSec ?? localStretchElapsed;
    const peerLocals = stretchPassRowsBase.map(
      (row) => row.stretchContext.stretchElapsedSec ?? -1,
    );
    return stretchProgressColorForValue(referenceLocal, peerLocals, "stretch");
  }, [
    showStretchTime,
    stretchReferenceStretchContext,
    localStretchElapsed,
    stretchPassRowsBase,
  ]);

  const stretchOverlays = useMemo(() => {
    if (showSegmentTime) {
      return buildStretchOverlays(
        null,
        comparison,
        referencePoints,
        segmentCurrentStretch?.index ?? null,
      );
    }
    if (showStretchTime) {
      return buildStretchOverlays(
        null,
        comparison,
        referencePoints,
        currentStretch?.index ?? null,
      );
    }
    return [];
  }, [
    showSegmentTime,
    showStretchTime,
    comparison,
    referencePoints,
    segmentCurrentStretch,
    currentStretch,
  ]);

  const activityMapMarkers = useMemo(() => {
    if (!showActivityScrub) return [];
    return soloActivityMarker(
      activityPoints,
      positionIndex,
      activityDurationSec,
      SOLO_ACTIVITY_COLOR,
    );
  }, [showActivityScrub, activityPoints, positionIndex, activityDurationSec]);

  const segmentMapMarkers = useMemo(
    () => (showSegmentTime ? markersFromPassRows(segmentPassRows, "segment") : []),
    [showSegmentTime, segmentPassRows],
  );

  const stretchMapMarkers = useMemo(
    () => (showStretchTime ? markersFromPassRows(stretchPassRows, "stretch") : []),
    [showStretchTime, stretchPassRows],
  );

  const stretchChartElevationPoints = useMemo(() => {
    if (!showStretchTime || !currentStretch || !referencePoints.length) return [];
    return slicePointsForStretch(referencePoints, currentStretch);
  }, [showStretchTime, currentStretch, referencePoints]);

  const goToStretchStart = (stretchIndex: number) => {
    setStretchVirtualSec(virtualAtStretchStart(stretchIndex, stretchDurationList));
  };

  const onPrevStretch = () => {
    if (stretchPos.stretchIndex <= 0) return;
    goToStretchStart(stretchPos.stretchIndex - 1);
  };

  const onNextStretch = () => {
    if (stretchPos.stretchIndex >= stretches.length - 1) return;
    goToStretchStart(stretchPos.stretchIndex + 1);
  };

  const onStretchLocalFractionChange = (fraction: number) => {
    const local = Math.round(Math.max(0, Math.min(1, fraction)) * localStretchMax);
    const base = virtualAtStretchStart(stretchPos.stretchIndex, stretchDurationList);
    setStretchVirtualSec(base + local);
  };

  const positionMax = Math.max(0, activityPoints.length - 1);
  const segmentTimeStep = timeSliderStep(maxSegmentTimeSec);
  const stretchTimeStep = timeSliderStep(stretchVirtualMax);

  const compareTabsAvailable = segmentTimeAvailable || stretchTimeAvailable;

  return {
    referencePoints,
    activeTab,
    setActiveTab,
    compareTabsAvailable,
    segmentTimeAvailable,
    stretchTimeAvailable,
    // Activity solo
    showActivityScrub,
    positionIndex,
    positionMax,
    positionFraction,
    onPositionSlider: setPositionIndex,
    activityMetrics,
    activityMapMarkers,
    // Segment time
    showSegmentTime,
    segmentElapsedSec,
    setSegmentElapsedSec,
    maxSegmentTimeSec,
    segmentTimeStep,
    segmentCurrentStretch,
    segmentPassRows,
    segmentReferenceMetrics,
    segmentReferenceStretchContext,
    segmentReferencePositionColor,
    segmentMapMarkers,
    // Stretch time
    showStretchTime,
    stretchVirtualSec,
    setStretchVirtualSec,
    stretchVirtualMax,
    stretchTimeStep,
    stretchPos,
    currentStretch,
    localStretchElapsed,
    localStretchMax,
    stretchPassRows,
    stretchReferenceMetrics,
    stretchReferenceStretchContext,
    stretchReferencePositionColor,
    stretchMapMarkers,
    stretchChartElevationPoints,
    onPrevStretch,
    onNextStretch,
    onStretchLocalFractionChange,
    canPrevStretch: stretchPos.stretchIndex > 0,
    canNextStretch: stretchPos.stretchIndex < stretches.length - 1,
    stretchOverlays,
    showAheadLegend: stretches.length > 0 && passSlices.length > 0,
    stretchesCount: stretches.length,
  };
};
