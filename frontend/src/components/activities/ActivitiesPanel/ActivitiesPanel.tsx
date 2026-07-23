import { useMemo, useRef, useState } from "react";
import { useProfileContext } from "../../../app/ProfileContext";
import {
  Dropzone,
  DropzoneLabel,
  ErrorText,
  FilePicker,
  Spinner,
  Stack,
  UploadStatus,
} from "../../ui";
import { useActivityUpload } from "../../../hooks/useActivityUpload";
import type { ActivitySummary } from "../../../types";
import { SidebarListToolbar } from "../../AppSidebar/SidebarListToolbar";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";
import { ProfileScopeHint } from "../../profiles/ProfileScopeHint";
import { ActivityPreviewPopover } from "../../previews/ActivityPreviewPopover";
import { ActivityDateTime } from "../ActivityDateTime";
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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState<{
    id: number;
    name: string;
    rect: DOMRect;
  } | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const upload = useActivityUpload({
    profileId: activeProfileId ?? 0,
    onRefresh,
    onError: setError,
  });

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
            {error && <ErrorText>{error}</ErrorText>}

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

        <div className={activitiesPanelStyles.footer}>
          <Dropzone
            footer
            disabled={upload.uploading}
            state={upload.dropzoneState}
            onDragActiveChange={upload.setDragOver}
            onFiles={(files) => void upload.handleUpload(files)}
          >
            {upload.uploading ? (
              <UploadStatus footer>
                <Spinner />
                <span className="truncate">{upload.statusText}</span>
              </UploadStatus>
            ) : upload.uploadPhase === "done" ? (
              <UploadStatus footer ok>
                <span className="truncate">{upload.statusText}</span>
              </UploadStatus>
            ) : (
              <>
                <DropzoneLabel footer>Drop GPX, TCX, KML, fitlog, or CSV</DropzoneLabel>
                <FilePicker
                  footer
                  inputRef={upload.fileInputRef}
                  accept=".gpx,.tcx,.kml,.kmz,.fitlog,.csv"
                  multiple
                  label="Choose file"
                  onFiles={(files) => void upload.handleUpload(files)}
                />
              </>
            )}
          </Dropzone>
        </div>
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