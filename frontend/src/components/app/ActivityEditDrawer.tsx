import { useEffect, useState } from "react";
import type { ActivitySummary, Profile } from "../../types";
import { Button, Drawer, ErrorText, Input } from "../ui";
import { entityEditDrawerStyles } from "./entityEditDrawerStyles";

const ACTIVITY_EDIT_FORM_ID = "activity-edit-form";

type ActivityEditDrawerProps = {
  open: boolean;
  activity: ActivitySummary;
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (activityId: number, name: string, profileId: number) => void;
};

export const ActivityEditDrawer = ({
  open,
  activity,
  profiles,
  loading,
  error,
  onClose,
  onSave,
}: ActivityEditDrawerProps) => {
  const [nameDraft, setNameDraft] = useState(activity.name);
  const [profileIdDraft, setProfileIdDraft] = useState(activity.profile_id);

  useEffect(() => {
    if (!open) return;
    setNameDraft(activity.name);
    setProfileIdDraft(activity.profile_id);
  }, [activity.name, activity.profile_id, open]);

  const unchanged =
    nameDraft.trim() === activity.name && profileIdDraft === activity.profile_id;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit activity"
      footer={
        <div className={entityEditDrawerStyles.footerActions}>
          <Button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={ACTIVITY_EDIT_FORM_ID}
            variant="primary"
            disabled={loading || !nameDraft.trim() || unchanged}
          >
            Save
          </Button>
        </div>
      }
    >
      <form
        id={ACTIVITY_EDIT_FORM_ID}
        className={entityEditDrawerStyles.scrollForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (!nameDraft.trim() || unchanged) return;
          onSave(activity.id, nameDraft.trim(), profileIdDraft);
        }}
      >
        <label className={entityEditDrawerStyles.field}>
          <span className={entityEditDrawerStyles.label}>Name</span>
          <Input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Activity name"
            autoFocus
          />
        </label>
        <label className={entityEditDrawerStyles.field}>
          <span className={entityEditDrawerStyles.label}>Profile</span>
          <select
            className={entityEditDrawerStyles.select}
            value={profileIdDraft}
            disabled={loading}
            onChange={(e) => setProfileIdDraft(Number(e.target.value))}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
        {error && <ErrorText>{error}</ErrorText>}
      </form>
    </Drawer>
  );
};