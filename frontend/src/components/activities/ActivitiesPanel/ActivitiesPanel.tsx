import { useMemo, useRef, useState } from "react";
import { useProfileContext } from "../../../app/ProfileContext";
import { Stack } from "../../ui";
import type { ActivitySummary } from "../../../types";
import { SidebarListToolbar } from "../../AppSidebar/SidebarListToolbar";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";
import { ProfileScopeHint } from "../../profiles/ProfileScopeHint";
import { ActivityPreviewPopover } from "../../previews/ActivityPreviewPopover";
import { ActivityDateTime } from "../ActivityDateTime";
import { ActivityUploadControl } from "../ActivityUploadControl";
import { activitiesPanelStyles } from "./ActivitiesPanel.styles";
import {
  activityMetaLine,
  filterAndSortActivitiesBySearch,
} from "./activitiesPanelUtils";

type ActivitiesPanelProps = {
  activities: ActivitySummary[];
  selectedActivityId: number | null;
  onSelectActivity: (id: number) => void;
  onRefresh: () => Promise<void>;
};

export const ActivitiesPanel = ({
  activities,
  selectedActivityId,
  onSelectActivity,
  onRefresh,
}: ActivitiesPanelProps) => {
  const { activeProfileId, viewScope } = useProfileContext();
  const viewingAll = viewScope === "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState<{
    id: number;
    name: string;
    rect: DOMRect;
  } | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const visibleActivities = useMemo(
    () => filterAndSortActivitiesBySearch(activities, searchQuery),
    [activities, searchQuery],
  );

  const schedulePreview = (activity: ActivitySummary, element: HTMLElement) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setPreview({
        id: activity.id,
        name: activity.name,
        rect: element.getBoundingClientRect(),
      });
    }, 350);
  };

  const clearPreview = () => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    setPreview(null);
  };

  return (
    <>
      <div className={activitiesPanelStyles.root}>
        <div className={activitiesPanelStyles.body}>
          <Stack>
            <SidebarListToolbar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tags, name, profile…"
              visibleCount={visibleActivities.length}
              totalCount={activities.length}
              itemNoun="activity"
            />

            <ProfileScopeHint />

            <ul className={sidebarListStyles.list}>
              {visibleActivities.length === 0 && (
                <li className={sidebarListStyles.listEmpty}>
                  {activities.length === 0 ? "No activities yet." : "No matches."}
                </li>
              )}
              {visibleActivities.map((activity) => (
                <li
                  key={activity.id}
                  className={sidebarListStyles.listItem(
                    selectedActivityId === activity.id,
                  )}
                  onClick={() => onSelectActivity(activity.id)}
                  onMouseEnter={(e) => schedulePreview(activity, e.currentTarget)}
                  onMouseLeave={clearPreview}
                >
                  <div className={sidebarListStyles.itemName} title={activity.name}>
                    {activity.name}
                  </div>
                  <div className={sidebarListStyles.itemMeta}>
                    {viewingAll && (
                      <>
                        <span>{activity.profile_name}</span>
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    <ActivityDateTime
                      started_at={activity.started_at}
                      created_at={activity.created_at}
                      name={activity.name}
                      source_filename={activity.source_filename}
                    />
                    <span aria-hidden="true"> · </span>
                    <span>{activityMetaLine(activity)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Stack>
        </div>

        {activeProfileId != null && (
          <div className={activitiesPanelStyles.footer}>
            <ActivityUploadControl
              variant="footer"
              profileId={activeProfileId}
              onRefresh={onRefresh}
            />
          </div>
        )}
      </div>

      {preview && (
        <ActivityPreviewPopover
          activityId={preview.id}
          activityName={preview.name}
          anchorRect={preview.rect}
        />
      )}
    </>
  );
};