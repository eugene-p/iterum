import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { appStyles } from "../../App.styles";
import { SegmentDetailBody } from "../../components/app/SegmentDetailBody";
import { SegmentDetailHeader } from "../../components/app/SegmentDetailHeader";
import { SegmentDetailMap } from "../../components/app/SegmentDetailMap";
import {
  SegmentPassSelectionProvider,
  useSegmentPassSelectionContext,
} from "../../components/app/SegmentPassSelectionContext";
import { RouteExplorer } from "../../components/route-explorer/RouteExplorer";
import {
  APP_VIEW,
  isViewValidForLocation,
  parseAppLocation,
  parseAppSearchParams,
} from "../appRoutes";
import { useSegmentScreen } from "../useSegmentScreen";
import { useAppNavigation } from "../useAppNavigation";

const SegmentCompareExplorer = ({
  compareMode,
  onCompareModeChange,
  onClose,
  target,
}: {
  compareMode: ReturnType<typeof parseAppSearchParams>["compareMode"];
  onCompareModeChange: ReturnType<typeof useAppNavigation>["setCompareMode"];
  onClose: () => void;
  target: { kind: "segment"; comparison: NonNullable<ReturnType<typeof useSegmentScreen>["comparison"]> };
}) => {
  const { selectedPassIds, applyPassSelection } = useSegmentPassSelectionContext();
  return (
    <RouteExplorer
      target={target}
      compareMode={compareMode}
      onCompareModeChange={onCompareModeChange}
      selectedPassIds={selectedPassIds}
      onSelectedPassIdsChange={applyPassSelection}
      onClose={onClose}
    />
  );
};

export const SegmentScreenContainer = () => {
  const { segmentId: segmentIdParam } = useParams();
  const parsedSegmentId = Number.parseInt(segmentIdParam ?? "", 10);
  const segmentId = Number.isFinite(parsedSegmentId) && parsedSegmentId > 0 ? parsedSegmentId : -1;
  const navigation = useAppNavigation();
  const { pathname, search } = useLocation();
  const searchParams = useMemo(() => parseAppSearchParams(search), [search]);
  const location = useMemo(() => parseAppLocation(pathname), [pathname]);
  const screen = useSegmentScreen(segmentId);

  const showCompareExplorer =
    searchParams.view === APP_VIEW.COMPARE &&
    isViewValidForLocation(location, APP_VIEW.COMPARE) &&
    screen.comparison != null;

  const compareTarget = useMemo(
    () =>
      screen.comparison
        ? ({ kind: "segment", comparison: screen.comparison } as const)
        : null,
    [screen.comparison],
  );

  if (!screen.segmentEntity) return null;

  return (
    <div className={appStyles.segmentDetail}>
      <SegmentDetailHeader
        segment={screen.segmentEntity}
        comparison={screen.comparison}
        selectedPass={screen.pass}
        selectedStretch={screen.selectedStretch}
        selectedPassStretchMetrics={screen.selectedPassStretchMetrics}
        headerActions={{
          loading: screen.actionsLoading,
          editError: screen.editError,
          onSegmentSaved: navigation.goSegment,
          onComparePasses: () => {
            if (!screen.comparison) return;
            navigation.openCompareView();
          },
          onReverse: screen.handleReverseSegment,
          onRescan: () => void screen.handleRescan(),
          onDelete: () => void screen.handleDelete(),
          stretchSourcePassId: screen.stretchSourcePassId,
          stretchSourceActivityId: screen.stretchSourceActivityId,
          onSetStretchSource: screen.setStretchSourceActivity,
        }}
      />
      <div className={appStyles.detailBody}>
        <SegmentPassSelectionProvider
          segmentId={segmentId}
          comparison={screen.comparison}
          selectedStretch={screen.selectedStretch}
          activityTracks={screen.activityTracks}
          pathname={pathname}
          location={location}
          searchParams={searchParams}
        >
          <SegmentDetailBody
            comparison={screen.comparison}
            stretch={{
              selectedStretch: screen.selectedStretch,
              selectedPassStretchMetrics: screen.selectedPassStretchMetrics,
              thresholds: screen.stretchThresholds,
              defaultThresholds: screen.defaultStretchThresholds,
              stretchSourceActivityId: screen.stretchSourceActivityId,
              stretchCanSave: screen.stretchCanSave,
              stretchState: screen.stretchState,
              selectedStretchIndex: screen.selectedStretchIndex,
              stretchSourcePassId: screen.stretchSourcePassId,
              loading: screen.stretchLoading,
            }}
            actions={{
              onSelectStretch: screen.selectStretch,
              onClearStretchSelection: screen.clearStretchSelection,
              onPreviewStretchThresholds: screen.previewStretchThresholds,
              onSetStretchSourceActivity: screen.setStretchSourceActivity,
              onResetStretchPreview: screen.resetStretchPreview,
              onSaveStretches: () => void screen.saveStretches(),
            }}
          />
          <div className={appStyles.detailMapPane}>
            <SegmentDetailMap
              routes={screen.mapRoutes}
              segment={screen.segmentEntity}
              segmentHighlightPoints={screen.segmentHighlightPoints}
              stretchOverlays={screen.stretchOverlays}
            />
          </div>
          {showCompareExplorer && compareTarget && (
            <SegmentCompareExplorer
              compareMode={searchParams.compareMode}
              onCompareModeChange={navigation.setCompareMode}
              onClose={navigation.closeView}
              target={compareTarget}
            />
          )}
        </SegmentPassSelectionProvider>
      </div>
    </div>
  );
};
