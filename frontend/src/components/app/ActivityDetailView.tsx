import { useCallback } from "react";
import { appStyles } from "../../App.styles";
import type { ActivitySummary, Profile, TrackPoint } from "../../types";
import { ActivityDateTime } from "../activities/ActivityDateTime";
import { ActivityHeaderMetrics } from "../activities/ActivityHeaderMetrics";
import { ActivityStatsPanel } from "../activities/ActivityStatsPanel";
import { ActivityMap } from "../maps/ActivityMap";
import { ExpandableDetailMap } from "../maps/ExpandableDetailMap";
import { RouteWorkspace } from "../maps/RouteWorkspace";
import { Button } from "../ui";
import { ActivityActionsBar } from "./ActivityActionsBar";
import { DetailHeader } from "./DetailHeader";
import { detailHeaderStyles } from "./DetailHeader.styles";

type MapRoute = { id: number; points: TrackPoint[]; selected: boolean };

type ActivityDetailViewProps = {
  activity: ActivitySummary;
  trackPoints?: TrackPoint[];
  mapRoutes: MapRoute[];
  actionLoading: boolean;
  editError: string | null;
  onSaveEdit: (activityId: number, name: string, profileId: number) => Promise<boolean>;
  onCreateSegment: () => void;
  onSelectSegment: (segmentId: number) => void;
  onViewRoute: () => void;
  onDelete: () => void;
  profiles: Profile[];
};

export const ActivityDetailView = ({
  activity,
  trackPoints,
  mapRoutes,
  actionLoading,
  editError,
  onSaveEdit,
  onCreateSegment,
  onSelectSegment,
  onViewRoute,
  onDelete,
  profiles,
}: ActivityDetailViewProps) => {
  const hasMap = mapRoutes.length > 0;
  const renderMap = useCallback(
    () => (
      <ActivityMap
        routes={mapRoutes}
        segment={null}
        segmentDraft={undefined}
        segmentHighlight={[]}
        draftHighlight={[]}
        segmentMode="none"
      />
    ),
    [mapRoutes],
  );

  return (
  <>
    <title>Iterum: Activity</title>    
    <div className={appStyles.detailScreen}>
      <DetailHeader
        typeLabel="Activity"
        title={activity.name}
        metadata={
          <span className={detailHeaderStyles.metadata}>
            <ActivityDateTime
              started_at={activity.started_at}
              created_at={activity.created_at}
              name={activity.name}
              source_filename={activity.source_filename}
            />
            <ActivityHeaderMetrics activity={activity} />
          </span>
        }
        actions={<ActivityActionsBar
          activity={activity}
          profiles={profiles}
          loading={actionLoading}
          editError={editError}
          onSaveEdit={onSaveEdit}
          onCreateSegment={onCreateSegment}
          onViewRoute={onViewRoute}
          onDelete={onDelete}
        />}
      />
      <div className={appStyles.activityDetailBody}>
        <RouteWorkspace
          title="Route workspace"
          description="Define a reusable segment from any part of this route."
          action={<Button variant="primary" size="sm" onClick={onCreateSegment}>Create segment from route</Button>}
        >
          <ExpandableDetailMap
            title={activity.name}
            hasContent={hasMap}
            emptyMessage="Loading activity route…"
            renderMap={renderMap}
            expandLabel="Expand map"
          />
        </RouteWorkspace>
        <ActivityStatsPanel
          activity={activity}
          trackPoints={trackPoints}
          onSelectSegment={onSelectSegment}
        />
      </div>
    </div>
  </>
  );
};
