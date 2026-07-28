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
import { StretchTimePanel } from "../components/StretchTimePanel";
import { TimeComparePanel } from "../components/TimeComparePanel";
import { APP_COMPARE_MODE, type CompareMode } from "../../../app/appRoutes";
import { routeExplorerStyles } from "./RouteExplorer.styles";
import type { RouteExplorerTarget } from "./RouteExplorerTarget";
import { useRouteExplorerData } from "./useRouteExplorerData";
import { useRouteExplorerCompareState } from "./useRouteExplorerCompareState";

type RouteExplorerPresentation = "modal" | "workspace";

type RouteExplorerProps = {
  target: RouteExplorerTarget;
  onClose: () => void;
  /** modal = overlay (activity view route); workspace = full main (segment compare). */
  presentation?: RouteExplorerPresentation;
  compareMode?: CompareMode | null;
  onCompareModeChange?: (mode: CompareMode) => void;
  selectedPassIds?: ReadonlyArray<number> | null;
  onSelectedPassIdsChange?: (ids: ReadonlyArray<number>) => void;
};

export const RouteExplorer = ({
  target,
  onClose,
  presentation = "modal",
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
    applyPassSelection,
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

  const showCompareTabs = !loading && !error && !isActivity && compare.compareTabsAvailable;

  const subtitle = (
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
  );

  const compareModeTabs = showCompareTabs ? (
    <>
      {compare.segmentTimeAvailable && (
        <Tabs.Trigger value={APP_COMPARE_MODE.SEGMENT}>Segment time</Tabs.Trigger>
      )}
      {compare.stretchTimeAvailable && (
        <Tabs.Trigger value={APP_COMPARE_MODE.STRETCH}>Stretch time</Tabs.Trigger>
      )}
    </>
  ) : null;

  const explorerContent = (
    <>
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
              onSetPassIncluded={setPassIncluded}
              onApplySelection={applyPassSelection}
            />
          )}

          {compare.showActivityScrub ? (
            <PositionComparePanel
              isActivity
              zoneMaxHr={zoneMaxHr}
              activityDurationSec={activityDurationSec}
              matchedPasses={matchedPasses}
              slider={{
                index: compare.positionIndex,
                max: compare.positionMax,
                fraction: compare.positionFraction,
                currentStretch: null,
                onChange: compare.onPositionSlider,
              }}
              map={{
                routePoints: activityPoints,
                highlightPoints: [],
                stretchOverlays: [],
                clickableRoute: activityPoints,
                markers: compare.activityMapMarkers,
              }}
              metrics={{
                activity: compare.activityMetrics,
                reference: null,
                referenceStretchContext: null,
                referencePositionColor: null,
                showPositionLegend: false,
                passRows: [],
              }}
            />
          ) : compare.showStretchTime ? (
            <StretchTimePanel
              zoneMaxHr={zoneMaxHr}
              matchedPasses={matchedPasses}
              slider={{
                virtualSec: compare.stretchVirtualSec,
                virtualMaxSec: compare.stretchVirtualMax,
                step: compare.stretchTimeStep,
                localElapsedSec: compare.localStretchElapsed,
                localMaxSec: compare.localStretchMax,
                stretchIndex: compare.stretchPos.stretchIndex,
                stretchesCount: compare.stretchesCount,
                currentStretch: compare.currentStretch,
                canPrev: compare.canPrevStretch,
                canNext: compare.canNextStretch,
                onVirtualChange: compare.setStretchVirtualSec,
                onPrev: compare.onPrevStretch,
                onNext: compare.onNextStretch,
                onLocalFractionChange: compare.onStretchLocalFractionChange,
              }}
              map={{
                routePoints: compare.referencePoints,
                stretchElevationPoints: compare.stretchChartElevationPoints,
                fitPoints: compare.stretchChartElevationPoints,
                fitKey:
                  compare.currentStretch != null
                    ? `stretch-${compare.currentStretch.index}`
                    : "stretch",
                stretchOverlays: compare.stretchOverlays,
                markers: compare.stretchMapMarkers,
              }}
              metrics={{
                reference: compare.stretchReferenceMetrics,
                referenceStretchContext: compare.stretchReferenceStretchContext,
                referencePositionColor: compare.stretchReferencePositionColor,
                showPositionLegend: compare.showAheadLegend,
                passRows: compare.stretchPassRows,
              }}
            />
          ) : (
            <TimeComparePanel
              zoneMaxHr={zoneMaxHr}
              matchedPasses={matchedPasses}
              slider={{
                elapsedSec: compare.segmentElapsedSec,
                maxSec: compare.maxSegmentTimeSec,
                step: compare.segmentTimeStep,
                currentStretch: compare.segmentCurrentStretch,
                onChange: compare.setSegmentElapsedSec,
              }}
              map={{
                routePoints: compare.referencePoints,
                stretchOverlays: compare.stretchOverlays,
                markers: compare.segmentMapMarkers,
              }}
              metrics={{
                reference: compare.segmentReferenceMetrics,
                referenceStretchContext: compare.segmentReferenceStretchContext,
                referencePositionColor: compare.segmentReferencePositionColor,
                showPositionLegend: compare.showAheadLegend,
                passRows: compare.segmentPassRows,
              }}
            />
          )}
        </Stack>
      )}
    </>
  );

  if (presentation === "workspace") {
    return (
      <div className={routeExplorerStyles.workspace}>
        <Tabs
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          value={compare.activeTab}
          onValueChange={compare.setActiveTab}
          aria-label="Route explorer comparison mode"
        >
          <div className={routeExplorerStyles.workspaceHeader}>
            <button
              type="button"
              className={routeExplorerStyles.workspaceBack}
              onClick={onClose}
            >
              Back to segment
            </button>
            <span className={routeExplorerStyles.toolbarSep} aria-hidden="true">
              ·
            </span>
            <div className={routeExplorerStyles.workspaceHeaderLead}>
              <h2 className={routeExplorerStyles.workspaceTitle}>Compare passes</h2>
              {subtitle}
            </div>
            {showCompareTabs && (
              <Tabs.List className={routeExplorerStyles.workspaceTabBar}>{compareModeTabs}</Tabs.List>
            )}
          </div>
          <div className={routeExplorerStyles.workspaceBody}>{explorerContent}</div>
        </Tabs>
      </div>
    );
  }

  return (
    <Modal open onClose={onClose} panelClassName={routeExplorerStyles.panel}>
      <ModalHeader
        title="Route Explorer"
        onClose={onClose}
        closeLabel="Close Route Explorer"
        className={showCompareTabs ? routeExplorerStyles.headerWithTabs : undefined}
        subtitle={subtitle}
      />
      <Tabs
        value={compare.activeTab}
        onValueChange={compare.setActiveTab}
        aria-label="Route explorer comparison mode"
      >
        {showCompareTabs && (
          <Tabs.List className={routeExplorerStyles.tabBar}>{compareModeTabs}</Tabs.List>
        )}
        {explorerContent}
      </Tabs>
    </Modal>
  );
};
