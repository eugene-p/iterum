import { useMemo, useState } from "react";
import { appStyles } from "../../App.styles";
import type { ActivitySummary, Profile } from "../../types";
import { Button, DropdownMenu } from "../ui";
import { ActivityEditDrawer } from "./ActivityEditDrawer";

type ActivityActionsBarProps = {
  activity: ActivitySummary;
  profiles: Profile[];
  loading: boolean;
  editError: string | null;
  onSaveEdit: (activityId: number, name: string, profileId: number) => Promise<boolean>;
  onCreateSegment: () => void;
  onViewRoute: () => void;
  onDelete: () => void;
};

export const ActivityActionsBar = ({
  activity,
  profiles,
  loading,
  editError,
  onSaveEdit,
  onCreateSegment,
  onViewRoute,
  onDelete,
}: ActivityActionsBarProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const actionGroups = useMemo(
    () => [
      {
        items: [
          { id: "route", label: "View route", onSelect: onViewRoute, disabled: loading },
          {
            id: "edit",
            label: "Edit",
            onSelect: () => setEditOpen(true),
            disabled: loading,
          },
        ],
      },
      {
        items: [
          {
            id: "delete",
            label: "Delete",
            onSelect: onDelete,
            disabled: loading,
            variant: "danger" as const,
          },
        ],
      },
    ],
    [loading, onDelete, onViewRoute],
  );

  return (
    <>
      <div className={appStyles.segmentActions}>
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateSegment}
          disabled={loading}
        >
          Create segment
        </Button>
        <DropdownMenu triggerLabel="Actions" groups={actionGroups} disabled={loading} />
      </div>
      <ActivityEditDrawer
        open={editOpen}
        activity={activity}
        profiles={profiles}
        loading={loading}
        error={editError}
        onClose={() => setEditOpen(false)}
        onSave={(activityId, name, profileId) => {
          void onSaveEdit(activityId, name, profileId).then((saved) => {
            if (saved) setEditOpen(false);
          });
        }}
      />
    </>
  );
};