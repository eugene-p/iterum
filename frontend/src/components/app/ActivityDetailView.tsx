import { useCallback } from "react";
import { appStyles } from "../../App.styles";
import type { ActivitySummary, Profile, TrackPoint } from "../../types";
import { ActivityDateTime } from "../activities/ActivityDateTime";
import { ActivityStatsPanel } from "../activities/ActivityStatsPanel";
import { ActivityMap } from "../maps/ActivityMap";
import { ExpandableDetailMap } from "../maps/ExpandableDetailMap";
import { Badge, Button, MutedSpan } from "../ui";
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
      <div className={appStyles.activityDetailBody}>
        <section className={appStyles.activityRouteSection} aria-labelledby="activity-route-title">
          <div className={appStyles.activityRouteWorkspace}>
            <ExpandableDetailMap
              title={activity.name}
              hasContent={hasMap}
              emptyMessage="Loading activity route…"
              renderMap={renderMap}
              expandLabel="Expand map"
            />
            <div className="absolute bottom-3 left-3 z-[500] max-w-sm rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-sm">
              <h2 id="activity-route-title" className="text-sm font-semibold">Route workspace</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Define a reusable segment from any part of this route.
              </p>
              <Button className="mt-3" variant="primary" size="sm" onClick={onCreateSegment}>
                Create segment from route
              </Button>
            </div>
          </div>
        </section>
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
