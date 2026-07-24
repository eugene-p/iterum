import { useEffect, useMemo, useState } from "react";
import { useProfileContext } from "../../app/ProfileContext";
import { estimateMaxHrFromYearOfBirth } from "../../lib/hrZones";
import { DEFAULT_STRETCH_THRESHOLDS } from "../../lib/stretchThresholds";
import { useDeleteProfileMutation, useUpdateProfileMutation } from "../../queries/profiles";
import type { Profile, StretchThresholds } from "../../types";
import { STRETCH_THRESHOLDS_SECTION_HINT } from "../segments/StretchPanel/stretchThresholdHints";
import { StretchThresholdSettings } from "../segments/StretchPanel/StretchThresholdSettings";
import { Button, CollapsibleSection, Drawer, ErrorText, HintButton, Input } from "../ui";
import { entityEditDrawerStyles } from "../app/entityEditDrawerStyles";

const PROFILE_EDIT_FORM_ID = "profile-edit-form";

type ProfileEditDrawerProps = {
  open: boolean;
  profile: Profile;
  onClose: () => void;
};

export const ProfileEditDrawer = ({ open, profile, onClose }: ProfileEditDrawerProps) => {
  const { activeProfileId, profiles, selectProfile, clearActiveProfile } = useProfileContext();
  const updateMutation = useUpdateProfileMutation();
  const deleteMutation = useDeleteProfileMutation();
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [yearOfBirthDraft, setYearOfBirthDraft] = useState(
    profile.year_of_birth != null ? String(profile.year_of_birth) : "",
  );
  const [thresholdDraft, setThresholdDraft] = useState<StretchThresholds>(
    profile.default_stretch_thresholds,
  );
  const [thresholdsExpanded, setThresholdsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNameDraft(profile.name);
    setYearOfBirthDraft(profile.year_of_birth != null ? String(profile.year_of_birth) : "");
    setThresholdDraft(profile.default_stretch_thresholds);
    setThresholdsExpanded(false);
    setError(null);
    setConfirmDelete(false);
  }, [open, profile]);

  const parsedYearOfBirth = useMemo(() => {
    const trimmed = yearOfBirthDraft.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) ? parsed : null;
  }, [yearOfBirthDraft]);

  const estimatedMaxHr = useMemo(
    () => estimateMaxHrFromYearOfBirth(parsedYearOfBirth),
    [parsedYearOfBirth],
  );

  const yearOfBirthInvalid = yearOfBirthDraft.trim() !== "" && parsedYearOfBirth === null;

  const unchanged =
    nameDraft.trim() === profile.name &&
    parsedYearOfBirth === profile.year_of_birth &&
    JSON.stringify(thresholdDraft) === JSON.stringify(profile.default_stretch_thresholds);

  const handleSave = async () => {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        name: nameDraft.trim(),
        year_of_birth: parsedYearOfBirth,
        default_stretch_thresholds: thresholdDraft,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(profile.id);
      const remaining = profiles.filter((p) => p.id !== profile.id);
      if (activeProfileId === profile.id) {
        if (remaining.length > 0) selectProfile(remaining[0].id);
        else clearActiveProfile();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit profile"
      size="wide"
      footer={
        <div className={entityEditDrawerStyles.footerActions}>
          <Button
            type="button"
            onClick={onClose}
            disabled={updateMutation.isPending || deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={PROFILE_EDIT_FORM_ID}
            variant="primary"
            disabled={updateMutation.isPending || !nameDraft.trim() || unchanged || yearOfBirthInvalid}
          >
            Save
          </Button>
        </div>
      }
    >
      <form
        id={PROFILE_EDIT_FORM_ID}
        className={entityEditDrawerStyles.scrollForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (!nameDraft.trim() || unchanged) return;
          void handleSave();
        }}
      >
        {error && <ErrorText>{error}</ErrorText>}
        <label className={entityEditDrawerStyles.field}>
          <span className={entityEditDrawerStyles.label}>Name</span>
          <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
        </label>

        <label className={entityEditDrawerStyles.field}>
          <span className={entityEditDrawerStyles.label}>Year of birth</span>
          <Input
            type="number"
            inputMode="numeric"
            min={1900}
            max={new Date().getFullYear()}
            placeholder="e.g. 1985"
            value={yearOfBirthDraft}
            onChange={(e) => setYearOfBirthDraft(e.target.value)}
          />
          <span className="text-xs text-muted">
            {estimatedMaxHr != null
              ? `Estimated max HR: ${estimatedMaxHr} bpm (220 − age). Used for heart-rate zone lines on charts.`
              : "Set your birth year to show heart-rate zones on activity charts."}
          </span>
        </label>

        <CollapsibleSection
          variant="card"
          headingLevel="h3"
          title="Default stretch thresholds"
          meta={<HintButton text={STRETCH_THRESHOLDS_SECTION_HINT} placement="top" />}
          expanded={thresholdsExpanded}
          onToggle={() => setThresholdsExpanded((value) => !value)}
        >
          <StretchThresholdSettings
            draft={thresholdDraft}
            onDraftChange={setThresholdDraft}
            showPreview={false}
            layout="sections"
            defaultThresholds={DEFAULT_STRETCH_THRESHOLDS}
          />
        </CollapsibleSection>

        <div className={entityEditDrawerStyles.dangerZone}>
          <p className={entityEditDrawerStyles.dangerText}>
            Delete this profile. Profiles with activities cannot be deleted.
          </p>
          {confirmDelete ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm">Delete &ldquo;{profile.name}&rdquo;?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
              <Button size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              className="mt-3"
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete profile
            </Button>
          )}
        </div>
      </form>
    </Drawer>
  );
};