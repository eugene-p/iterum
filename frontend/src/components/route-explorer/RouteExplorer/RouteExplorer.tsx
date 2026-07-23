import { useMemo } from "react";
import { useProfileContext } from "../../../app/ProfileContext";
import { profileMaxHr } from "../../../lib/hrZones";
import {
  ErrorText,
  LoadingState,
  Modal,
  ModalHeader,
  MutedText,
  Stack,
  Tabs,
} from "../../ui";
import { buildPassSlices } from "../../../routeExplorerUtils";
import { ActivityDateTime } from "../../activities/ActivityDateTime";
import { PassSelector } from "../components/PassSelector";
import { PositionComparePanel } from "../components/PositionComparePanel";
import { TimeComparePanel } from "../components/TimeComparePanel";
import type { CompareMode } from "../../../app/appRoutes";
import { routeExplorerStyles } from "./RouteExplorer.styles";
import type { RouteExplorerTarget } from "./RouteExplorerTarget";
import { useRouteExplorerData } from "./useRouteExplorerData";
import { useRouteExplorerCompareState } from "./useRouteExplorerCompareState";

type RouteExplorerProps = {
  target: RouteExplorerTarget;
  onClose: () => void;
  compareMode?: CompareMode | null;
  onCompareModeChange?: (mode: CompareMode) => void;
  selectedPassIds?: ReadonlyArray<number> | null;
  onSelectedPassIdsChange?: (ids: ReadonlyArray<number>) => void;
};

export const RouteExplorer = ({
  target,
  onClose,
  compareMode = null,
  onCompareModeChange,
  selectedPassIds = null,
  onSelectedPassIdsChange,
}: RouteExplorerProps) => {
  const { activeProfile, profiles } = useProfileContext();
  const {
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
  } = useRouteExplorerData(target, { selectedPassIds, onSelectedPassIdsChange });

  const zoneMaxHr = useMemo(() => {
    if (isActivity) {
      const profile = profiles.find((entry) => entry.id === activityProfileId);
      return profileMaxHr(profile);
    }
    return profileMaxHr(activeProfile);
  }, [activeProfile, activityProfileId, isActivity, profiles]);

  const includedPasses = useMemo(
    () => matchedPasses.filter((pass) => selectedPassIdSet.has(pass.id)),
    [matchedPasses, selectedPassIdSet],
  );

  const passSlices = useMemo(
    () => buildPassSlices(includedPasses, passTracks),
    [includedPasses, passTracks],
  );

  const compare = useRouteExplorerCompareState({
    target,
    isActivity,
    comparison,
    matchedPasses,
    activityPoints,
    activityDurationSec,
    passSlices,
    compareMode,
    selectedPassIds,
    onCompareModeChange,
  });

  const title =
    target.kind === "activity" ? target.activityName : (comparison?.segment.name ?? "Segment");

  return (
    <Modal open onClose={onClose} panelClassName={routeExplorerStyles.panel}>
      <ModalHeader
        title="Route Explorer"
        onClose={onClose}
        closeLabel="Close Route Explorer"
        className={
          !loading && !error && !isActivity && compare.timeTabAvailable
            ? routeExplorerStyles.headerWithTabs
            : undefined
        }
        subtitle={
          <>
            <span className={routeExplorerStyles.toolbarSep} aria-hidden="true">
              ·
            </span>
            <span className={routeExplorerStyles.toolbarSubtitle} title={title}>
              {title}
            </span>
            {isActivity && activityDateTime && (
              <>
                <span className={routeExplorerStyles.toolbarSep} aria-hidden="true">
                  ·
                </span>
                <ActivityDateTime
                  className={routeExplorerStyles.toolbarDateTime}
                  {...activityDateTime}
                />
              </>
            )}
          </>
        }
      />

      <Tabs
        value={compare.activeTab}
        onValueChange={compare.setActiveTab}
        aria-label="Route explorer comparison mode"
      >
        {!loading && !error && !isActivity && compare.timeTabAvailable && (
          <Tabs.List className={routeExplorerStyles.tabBar}>
            <Tabs.Trigger value="position">Position</Tabs.Trigger>
            <Tabs.Trigger value="time">Time</Tabs.Trigger>
          </Tabs.List>
        )}

        {error && <ErrorText>{error}</ErrorText>}

        {loading ? (
          <LoadingState message="Loading track data…" />
        ) : isActivity && activityPoints.length < 2 ? (
          <MutedText>Not enough track points for this activity.</MutedText>
        ) : !isActivity && compare.referencePoints.length < 2 ? (
          <MutedText>Not enough reference points for this segment.</MutedText>
        ) : (
          <Stack className={routeExplorerStyles.body}>
            {!isActivity && (
              <PassSelector
                matchedPasses={matchedPasses}
                selectedPassIdSet={selectedPassIdSet}
                expanded={compare.passesExpanded}
                onToggleExpanded={() => compare.setPassesExpanded((open) => !open)}
                onSetPassIncluded={setPassIncluded}
              />
            )}

            {isActivity || !compare.timeTabAvailable || compare.activeTab === "position" ? (
              <PositionComparePanel
                isActivity={isActivity}
                zoneMaxHr={zoneMaxHr}
                activityDurationSec={activityDurationSec}
                matchedPasses={matchedPasses}
                slider={{
                  index: compare.positionIndex,
                  max: compare.positionMax,
                  fraction: compare.positionFraction,
                  currentStretch: compare.currentStretch,
                  onChange: compare.onPositionSlider,
                }}
                map={{
                  routePoints: isActivity ? activityPoints : compare.referencePoints,
                  highlightPoints: [],
                  stretchOverlays: compare.stretchOverlays,
                  clickableRoute: isActivity ? activityPoints : compare.referencePoints,
                  markers: compare.mapMarkers,
                }}
                metrics={{
                  activity: compare.activityMetrics,
                  reference: compare.referenceMetrics,
                  referenceStretchContext: compare.referenceStretchContext,
                  referencePositionColor: compare.referencePositionColor,
                  showPositionLegend: compare.showPositionLegend,
                  passRows: compare.positionPassRows,
                }}
              />
            ) : (
              <TimeComparePanel
                zoneMaxHr={zoneMaxHr}
                matchedPasses={matchedPasses}
                slider={{
                  elapsedSec: compare.timeElapsedSec,
                  maxSec: compare.maxTimeSec,
                  step: compare.timeStep,
                  currentStretch: compare.timeCurrentStretch,
                  onChange: compare.setTimeElapsedSec,
                }}
                map={{
                  routePoints: compare.referencePoints,
                  stretchOverlays: compare.timeStretchOverlays,
                  markers: compare.timeMapMarkers,
                }}
                metrics={{
                  reference: compare.timeReferenceMetrics,
                  referenceStretchContext: compare.timeReferenceStretchContext,
                  referencePositionColor: compare.referencePositionColor,
                  showPositionLegend: compare.showPositionLegend,
                  passRows: compare.timePassRows,
                }}
              />
            )}
          </Stack>
        )}
      </Tabs>
    </Modal>
  );
};