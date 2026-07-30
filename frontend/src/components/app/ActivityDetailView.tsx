import { useCallback } from "react";
import { appStyles } from "../../App.styles";
import type { ActivitySummary, Profile, TrackPoint } from "../../types";
import { ActivityDateTime } from "../activities/ActivityDateTime";
import { ActivityStatsPanel } from "../activities/ActivityStatsPanel";
import { ActivityMap } from "../maps/ActivityMap";
import { ExpandableDetailMap } from "../maps/ExpandableDetailMap";
import { Badge, MutedSpan } from "../ui";
import { ActivityActionsBar } from "./ActivityActionsBar";

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
      <div className={appStyles.segmentMode}>
        <div className={appStyles.segmentModeInfo}>
          <Badge>Activity</Badge>
          <MutedSpan>{activity.name}</MutedSpan>
          <span className={appStyles.segmentModeActivity}>
            <ActivityDateTime
              started_at={activity.started_at}
              created_at={activity.created_at}
              name={activity.name}
              source_filename={activity.source_filename}
            />
          </span>
        </div>
        <ActivityActionsBar
          activity={activity}
          profiles={profiles}
          loading={actionLoading}
          editError={editError}
          onSaveEdit={onSaveEdit}
          onCreateSegment={onCreateSegment}
          onViewRoute={onViewRoute}
          onDelete={onDelete}
        />
      </div>
      <div className={appStyles.detailBody}>
        <div className={appStyles.detailPrimary}>
          <ActivityStatsPanel
            activity={activity}
            trackPoints={trackPoints}
            onSelectSegment={onSelectSegment}
          />
        </div>
        <div className={appStyles.detailMapPane}>
          <ExpandableDetailMap
            title={activity.name}
            hasContent={hasMap}
            emptyMessage="Loading activity route…"
            renderMap={renderMap}
          />
        </div>
      </div>
    </div>
  </>
  );
};
