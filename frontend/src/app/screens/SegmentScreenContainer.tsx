import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { appStyles } from "../../App.styles";
import { SegmentDetailBody } from "../../components/app/SegmentDetailBody";
import { SegmentDetailHeader } from "../../components/app/SegmentDetailHeader";
import {
  SegmentPassSelectionProvider,
  useSegmentPassSelectionContext,
} from "../../components/app/SegmentPassSelectionContext";
import { ScreenPlaceholder } from "../../components/ui/ScreenPlaceholder";
import { RouteExplorer } from "../../components/route-explorer/RouteExplorer";
import { StretchEditWorkspace } from "../../components/segments/StretchStripEditor";
import {
  APP_VIEW,
  isViewValidForLocation,
  parseAppLocation,
  parseAppSearchParams,
} from "../appRoutes";
import { useSegmentScreen } from "../useSegmentScreen";
import { useAppNavigation } from "../useAppNavigation";
import { useSegmentBaselinesQuery } from "../../queries/segments";
import type { SegmentPass } from "../../types";

const SegmentCompareExplorer = ({
  compareMode,
  onCompareModeChange,
  onClose,
  target,
}: {
  compareMode: ReturnType<typeof parseAppSearchParams>["compareMode"];
  onCompareModeChange: ReturnType<typeof useAppNavigation>["setCompareMode"];
  onClose: () => void;
  target: {
    kind: "segment";
    comparison: NonNullable<ReturnType<typeof useSegmentScreen>["comparison"]>;
  };
}) => {
  const { selectedPassIds, applyPassSelection } = useSegmentPassSelectionContext();
  return (
    <RouteExplorer
      presentation="workspace"
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
  const baselinesQuery = useSegmentBaselinesQuery(
    segmentId,
    searchParams.activityId,
    searchParams.passNumber,
  );
  const [baselineAggregationType, setBaselineAggregationType] = useState("rolling_90d");

  useEffect(() => {
    setBaselineAggregationType("rolling_90d");
  }, [segmentId]);

  const resolvedFocalActivityId =
    baselinesQuery.data?.activity_id ?? searchParams.activityId ?? null;
  const resolvedFocalPassNumber =
    baselinesQuery.data?.pass_number ?? searchParams.passNumber ?? null;

  const defaultFocalPass = useMemo(() => {
    const valid = (screen.comparison?.passes ?? []).filter(
      (pass) =>
        pass.matched &&
        pass.profile_id != null &&
        pass.duration_sec != null &&
        Number.isFinite(pass.duration_sec) &&
        pass.duration_sec > 0,
    );
    return [...valid].sort((a, b) => {
      const aTime = Date.parse(a.started_at ?? a.created_at ?? "") || 0;
      const bTime = Date.parse(b.started_at ?? b.created_at ?? "") || 0;
      return bTime - aTime || b.activity_id - a.activity_id || b.pass_number - a.pass_number;
    })[0] ?? null;
  }, [screen.comparison]);

  const handleFocusPass = (pass: SegmentPass) => {
    const isDefault =
      (baselinesQuery.data?.activity_id ?? defaultFocalPass?.activity_id) === pass.activity_id &&
      (baselinesQuery.data?.pass_number ?? defaultFocalPass?.pass_number) === pass.pass_number;
    navigation.setFocalPass(
      isDefault ? null : { activityId: pass.activity_id, passNumber: pass.pass_number },
    );
  };

  const showCompareExplorer =
    searchParams.view === APP_VIEW.COMPARE &&
    isViewValidForLocation(location, APP_VIEW.COMPARE) &&
    screen.comparison != null;

  const showStretchEdit =
    searchParams.view === APP_VIEW.STRETCHES &&
    isViewValidForLocation(location, APP_VIEW.STRETCHES) &&
    screen.comparison != null;

  useEffect(() => {
    if (!showStretchEdit) return;
    if (screen.selectedStretchIndex != null) return;
    const first = screen.displayStretches[0];
    if (first) screen.selectStretch(first);
  }, [
    showStretchEdit,
    screen.selectedStretchIndex,
    screen.displayStretches,
    screen.selectStretch,
  ]);

  const compareTarget = useMemo(
    () =>
      screen.comparison
        ? ({ kind: "segment", comparison: screen.comparison } as const)
        : null,
    [screen.comparison],
  );

  if (!screen.segmentEntity) {
    return <ScreenPlaceholder className={appStyles.screenOutlet} />;
  }

  return (
    <div className={appStyles.segmentDetail}>
      <SegmentPassSelectionProvider
        segmentId={segmentId}
        comparison={screen.comparison}
        selectedStretch={screen.selectedStretch}
        activityTracks={screen.activityTracks}
        pathname={pathname}
        location={location}
        searchParams={searchParams}
      >
        {showCompareExplorer && compareTarget ? (
          <SegmentCompareExplorer
            compareMode={searchParams.compareMode}
            onCompareModeChange={navigation.setCompareMode}
            onClose={navigation.closeView}
            target={compareTarget}
          />
        ) : showStretchEdit ? (
          <StretchEditWorkspace
            segment={screen.segmentEntity}
            session={screen.stretchEdit}
            selectedIndex={screen.selectedStretchIndex}
            stretches={screen.displayStretches}
            mapRoutes={screen.mapRoutes}
            segmentHighlightPoints={screen.segmentHighlightPoints}
            stretchOverlays={screen.stretchOverlays}
            convertOpen={screen.convertOpen}
            convertName={screen.convertName}
            convertBusy={screen.convertBusy}
            onConvertNameChange={screen.setConvertName}
            onOpenConvert={screen.openConvert}
            onCloseConvert={screen.closeConvert}
            onConfirmConvert={screen.confirmConvert}
            thresholds={screen.stretchThresholds}
            defaultThresholds={screen.defaultStretchThresholds}
            stretchCanSave={screen.stretchCanSave}
            stretchLoading={screen.stretchLoading}
            onPreviewThresholds={screen.previewStretchThresholds}
            onResetThresholdPreview={screen.resetStretchPreview}
            onSaveStretches={() => void screen.saveStretches()}
            onClose={navigation.closeView}
          />
        ) : (
          <>
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
                onEditStretches: () => {
                  if (!screen.comparison) return;
                  navigation.openStretchEditView();
                },
                onReverse: screen.handleReverseSegment,
                onRescan: () => void screen.handleRescan(),
                onDelete: () => void screen.handleDelete(),
                stretchSourcePassId: screen.stretchSourcePassId,
                stretchSourceActivityId: screen.stretchSourceActivityId,
                onSetStretchSource: screen.setStretchSourceActivity,
              }}
            />
            <SegmentDetailBody
              segment={screen.segmentEntity}
              comparison={screen.comparison}
              map={{
                routes: screen.mapRoutes,
                segmentHighlightPoints: screen.segmentHighlightPoints,
                stretchOverlays: screen.stretchOverlays,
              }}
              onComparePasses={navigation.openCompareView}
              onEditStretches={navigation.openStretchEditView}
              displayStretches={screen.displayStretches}
              baselines={baselinesQuery.data ?? null}
              baselineAggregationType={baselineAggregationType}
              onBaselineAggregationTypeChange={setBaselineAggregationType}
              focalActivityId={resolvedFocalActivityId}
              focalPassNumber={resolvedFocalPassNumber}
              onFocusPass={handleFocusPass}
              stretch={{
                selectedStretch: screen.selectedStretch,
                selectedPassStretchMetrics: screen.selectedPassStretchMetrics,
                stretchState: screen.stretchState,
                selectedStretchIndex: screen.selectedStretchIndex,
                stretchSourcePassId: screen.stretchSourcePassId,
                loading: screen.stretchLoading,
              }}
              actions={{
                onSelectStretch: screen.selectStretch,
                onClearStretchSelection: screen.clearStretchSelection,
              }}
            />
          </>
        )}
      </SegmentPassSelectionProvider>
    </div>
  );
};
