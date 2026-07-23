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
  buildPositionPassRows,
  buildTimePassRows,
  markersFromPassRows,
  soloActivityMarker,
} from "./comparePassRows";

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
  const [timeElapsedSec, setTimeElapsedSec] = useState(0);
  const [localCompareMode, setLocalCompareMode] = useState<CompareMode>(APP_COMPARE_MODE.POSITION);
  const [passesExpanded, setPassesExpanded] = useState(false);
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

  useEffect(() => {
    setPassesExpanded(false);
    setPositionIndex(0);
    setTimeElapsedSec(0);
  }, [targetKey]);

  const maxTimeSec = useMemo(() => {
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

  const timeTabAvailable = !isActivity && maxTimeSec > 0;

  const activeTab = isCompareModeControlled
    ? resolveCompareMode(
        { view: APP_VIEW.COMPARE, compareMode, comparePasses: selectedPassIds },
        timeTabAvailable,
      )
    : localCompareMode;

  const setActiveTab = (mode: CompareMode) => {
    if (onCompareModeChange) onCompareModeChange(mode);
    else setLocalCompareMode(mode);
  };

  useEffect(() => {
    if (timeElapsedSec > maxTimeSec) setTimeElapsedSec(maxTimeSec);
  }, [maxTimeSec, timeElapsedSec]);

  // Position→time sync lives only in onPositionSlider (and target reset).
  // Do not re-sync when pass selection or maxTime changes — that clobbers Time-tab scrub.

  useEffect(() => {
    if (!timeTabAvailable && activeTab === APP_COMPARE_MODE.TIME) {
      if (onCompareModeChange) onCompareModeChange(APP_COMPARE_MODE.POSITION);
      else setLocalCompareMode(APP_COMPARE_MODE.POSITION);
    }
  }, [timeTabAvailable, activeTab, onCompareModeChange]);

  const showPositionTab =
    isActivity || !timeTabAvailable || activeTab === APP_COMPARE_MODE.POSITION;
  const showTimeTab = !isActivity && timeTabAvailable && activeTab === APP_COMPARE_MODE.TIME;

  const positionFraction = useMemo(() => {
    const total = isActivity ? activityPoints.length : referencePoints.length;
    if (total <= 1) return 0;
    return positionIndex / (total - 1);
  }, [isActivity, activityPoints.length, referencePoints.length, positionIndex]);

  const stretches = useMemo(() => comparison?.stretches ?? [], [comparison?.stretches]);

  const referenceIndexAtTime = useMemo(() => {
    if (!showTimeTab || !referencePoints.length) return 0;
    return indexAtElapsedSec(referencePoints, timeElapsedSec, referenceDurationSec);
  }, [showTimeTab, referencePoints, timeElapsedSec, referenceDurationSec]);

  const referenceFractionAtTime = useMemo(() => {
    if (referencePoints.length <= 1) return 0;
    return referenceIndexAtTime / (referencePoints.length - 1);
  }, [referencePoints.length, referenceIndexAtTime]);

  const currentStretch = useMemo((): Stretch | null => {
    if (!showPositionTab || isActivity || !stretches.length || !referencePoints.length) return null;
    return stretchAtFraction(stretches, referencePoints, positionFraction);
  }, [showPositionTab, isActivity, stretches, referencePoints, positionFraction]);

  const timeCurrentStretch = useMemo((): Stretch | null => {
    if (!showTimeTab || !stretches.length || !referencePoints.length) return null;
    return stretchAtFraction(stretches, referencePoints, referenceFractionAtTime);
  }, [showTimeTab, stretches, referencePoints, referenceFractionAtTime]);

  const referenceStretchContext = useMemo(() => {
    if (!showPositionTab || isActivity || !referencePoints.length) return null;
    return stretchPointContextAtIndex(
      referencePoints,
      currentStretch,
      positionIndex,
      referenceDurationSec,
    );
  }, [
    showPositionTab,
    isActivity,
    referencePoints,
    currentStretch,
    positionIndex,
    referenceDurationSec,
  ]);

  const timeReferenceStretchContext = useMemo(() => {
    if (!showTimeTab || !referencePoints.length) return null;
    return stretchPointContextAtIndex(
      referencePoints,
      timeCurrentStretch,
      referenceIndexAtTime,
      referenceDurationSec,
    );
  }, [
    showTimeTab,
    referencePoints,
    timeCurrentStretch,
    referenceIndexAtTime,
    referenceDurationSec,
  ]);

  const stretchOverlays = useMemo(
    () =>
      showPositionTab
        ? buildStretchOverlays(null, comparison, referencePoints, currentStretch?.index ?? null)
        : [],
    [showPositionTab, comparison, referencePoints, currentStretch],
  );

  const timeStretchOverlays = useMemo(
    () =>
      showTimeTab
        ? buildStretchOverlays(
            null,
            comparison,
            referencePoints,
            timeCurrentStretch?.index ?? null,
          )
        : [],
    [showTimeTab, comparison, referencePoints, timeCurrentStretch],
  );

  const activityMetrics = useMemo(
    () =>
      showPositionTab && isActivity
        ? metricsAtIndex(activityPoints, positionIndex, activityDurationSec)
        : null,
    [showPositionTab, isActivity, activityPoints, positionIndex, activityDurationSec],
  );

  const referenceMetrics = useMemo(() => {
    if (!showPositionTab || isActivity || !referencePoints.length) return null;
    return metricsAtIndex(referencePoints, positionIndex, referenceDurationSec);
  }, [showPositionTab, isActivity, referencePoints, positionIndex, referenceDurationSec]);

  const timeReferenceMetrics = useMemo(() => {
    if (!showTimeTab || !referencePoints.length) return null;
    return metricsAtIndex(referencePoints, referenceIndexAtTime, referenceDurationSec);
  }, [showTimeTab, referencePoints, referenceIndexAtTime, referenceDurationSec]);

  const positionPassRowsBase = useMemo(() => {
    if (!showPositionTab || isActivity) return [];
    return buildPositionPassRows(passSlices, positionFraction, currentStretch, matchedPasses);
  }, [showPositionTab, isActivity, passSlices, positionFraction, currentStretch, matchedPasses]);

  const positionPassRows = useMemo(
    () => assignStretchProgressColors(positionPassRowsBase, stretches, "position"),
    [positionPassRowsBase, stretches],
  );

  const timePassRowsBase = useMemo(() => {
    if (!showTimeTab) return [];
    return buildTimePassRows(passSlices, timeElapsedSec, stretches, matchedPasses);
  }, [showTimeTab, passSlices, timeElapsedSec, stretches, matchedPasses]);

  const timePassRows = useMemo(
    () => assignStretchProgressColors(timePassRowsBase, stretches, "time"),
    [timePassRowsBase, stretches],
  );

  const referencePositionColor = useMemo(() => {
    if (isActivity || !stretches.length) return null;
    if (showTimeTab) {
      const referenceScore = stretchProgressScore(
        stretches,
        referencePoints,
        referenceFractionAtTime,
      );
      const peerScores = timePassRowsBase.map((row) =>
        stretchProgressScore(
          stretches,
          row.slice.points,
          segmentFractionAtIndex(row.slice.points, row.index),
        ),
      );
      return stretchProgressColorForValue(referenceScore, peerScores, "time");
    }
    if (!showPositionTab) return null;
    const peerElapsed = positionPassRowsBase.map(
      (row) =>
        metricsAtIndex(row.slice.points, row.index, row.slice.durationSec)?.elapsedSec ?? -1,
    );
    const referenceElapsed = referenceMetrics?.elapsedSec ?? -1;
    return stretchProgressColorForValue(referenceElapsed, peerElapsed, "position");
  }, [
    isActivity,
    stretches,
    referencePoints,
    showTimeTab,
    showPositionTab,
    referenceFractionAtTime,
    timePassRowsBase,
    positionPassRowsBase,
    referenceMetrics,
  ]);

  const mapMarkers = useMemo(() => {
    if (!showPositionTab) return [];
    if (isActivity) {
      return soloActivityMarker(
        activityPoints,
        positionIndex,
        activityDurationSec,
        SOLO_ACTIVITY_COLOR,
      );
    }
    return markersFromPassRows(positionPassRows, "pos");
  }, [
    showPositionTab,
    isActivity,
    activityPoints,
    positionIndex,
    activityDurationSec,
    positionPassRows,
  ]);

  const timeMapMarkers = useMemo(
    () => (showTimeTab ? markersFromPassRows(timePassRows, "time") : []),
    [showTimeTab, timePassRows],
  );

  const onPositionSlider = (value: number) => {
    setPositionIndex(value);
    if (!isActivity && referencePoints.length) {
      const elapsed = metricsAtIndex(referencePoints, value, referenceDurationSec)?.elapsedSec;
      if (elapsed != null) setTimeElapsedSec(Math.min(elapsed, maxTimeSec));
    }
  };

  const positionMax = Math.max(
    0,
    (isActivity ? activityPoints.length : referencePoints.length) - 1,
  );
  const timeStep = timeSliderStep(maxTimeSec);

  return {
    referencePoints,
    passesExpanded,
    setPassesExpanded,
    activeTab,
    setActiveTab,
    timeTabAvailable,
    positionIndex,
    positionMax,
    positionFraction,
    currentStretch,
    timeCurrentStretch,
    referenceStretchContext,
    timeReferenceStretchContext,
    referencePositionColor,
    showPositionLegend: stretches.length > 0 && passSlices.length > 0,
    stretchOverlays,
    timeStretchOverlays,
    timeElapsedSec,
    setTimeElapsedSec,
    maxTimeSec,
    timeStep,
    activityMetrics,
    referenceMetrics,
    timeReferenceMetrics,
    positionPassRows,
    timePassRows,
    mapMarkers,
    timeMapMarkers,
    onPositionSlider,
  };
};
