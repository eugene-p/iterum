import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ActivityDetailView } from "../../components/app";
import { RouteExplorer } from "../../components/route-explorer/RouteExplorer";
import { APP_VIEW, isViewValidForLocation, parseAppLocation, parseAppSearchParams } from "../appRoutes";
import { useActivityScreen } from "../useActivityScreen";
import { useAppNavigation } from "../useAppNavigation";

export const ActivityScreenContainer = () => {
  const { activityId: activityIdParam } = useParams();
  const parsedActivityId = Number.parseInt(activityIdParam ?? "", 10);
  const activityId =
    Number.isFinite(parsedActivityId) && parsedActivityId > 0 ? parsedActivityId : -1;
  const navigation = useAppNavigation();
  const screen = useActivityScreen(activityId);
  const { search } = useLocation();
  const searchParams = useMemo(() => parseAppSearchParams(search), [search]);
  const location = useMemo(() => parseAppLocation(`/activities/${activityId}`), [activityId]);
  const showRouteExplorer =
    searchParams.view === APP_VIEW.ROUTE && isViewValidForLocation(location, APP_VIEW.ROUTE);

  if (!screen.activityEntity) return null;

  return (
    <>
      <ActivityDetailView
        key={activityId}
        activity={screen.activityEntity}
        trackPoints={screen.trackPoints}
        mapRoutes={screen.mapRoutes}
        actionLoading={screen.actionLoading}
        editError={screen.editError}
        onSaveEdit={screen.handleSaveEdit}
        onCreateSegment={() => navigation.goCreateSegment(screen.activityEntity!.id)}
        onSelectSegment={navigation.goSegment}
        onViewRoute={navigation.openRouteView}
        onDelete={() => void screen.handleDelete(screen.activityEntity!)}
        profiles={screen.profiles}
      />
      {showRouteExplorer && (
        <RouteExplorer
          target={{
            kind: "activity",
            activityId: screen.activityEntity.id,
            activityName: screen.activityEntity.name,
          }}
          onClose={navigation.closeView}
        />
      )}
    </>
  );
};