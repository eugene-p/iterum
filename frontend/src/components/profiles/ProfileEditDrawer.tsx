import { useEffect, useMemo, useState } from "react";
import { useProfileContext } from "../../app/ProfileContext";
import { estimateMaxHrFromYearOfBirth } from "../../lib/hrZones";
import { DEFAULT_STRETCH_THRESHOLDS } from "../../lib/stretchThresholds";
import { useDeleteProfileMutation, useUpdateProfileMutation } from "../../queries/profiles";
import type { DistanceUnit, Profile, StretchThresholds } from "../../types";
import { STRETCH_THRESHOLDS_SECTION_HINT } from "../segments/StretchPanel/stretchThresholdHints";
import { StretchThresholdSettings } from "../segments/StretchPanel/StretchThresholdSettings";
import {
  Button,
  CollapsibleSection,
  Drawer,
  ErrorText,
  Field,
  HintButton,
  Input,
  Select,
} from "../ui";
import { entityEditDrawerStyles } from "../app/entityEditDrawerStyles";

const PROFILE_EDIT_FORM_ID = "profile-edit-form";
const METRES_PER_MILE = 1609.344;

const splitDistanceInUnit = (distanceM: number, unit: DistanceUnit): number =>
  unit === "mi" ? distanceM / METRES_PER_MILE : distanceM / 1_000;

const splitDistanceToMetres = (distance: number, unit: DistanceUnit): number =>
  distance * (unit === "mi" ? METRES_PER_MILE : 1_000);

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
  const [distanceUnitDraft, setDistanceUnitDraft] = useState<DistanceUnit>(profile.distance_unit);
  const [splitDistanceDraft, setSplitDistanceDraft] = useState(
    String(splitDistanceInUnit(profile.split_distance_m, profile.distance_unit)),
  );
  const [thresholdsExpanded, setThresholdsExpanded] = useState(false);
  const [splitDefaultsExpanded, setSplitDefaultsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNameDraft(profile.name);
    setYearOfBirthDraft(profile.year_of_birth != null ? String(profile.year_of_birth) : "");
    setThresholdDraft(profile.default_stretch_thresholds);
    setDistanceUnitDraft(profile.distance_unit);
    setSplitDistanceDraft(String(splitDistanceInUnit(profile.split_distance_m, profile.distance_unit)));
    setThresholdsExpanded(false);
    setSplitDefaultsExpanded(false);
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
  const parsedSplitDistance = useMemo(
    () => splitDistanceToMetres(Number(splitDistanceDraft), distanceUnitDraft),
    [distanceUnitDraft, splitDistanceDraft],
  );
  const splitDistanceInvalid =
    !Number.isFinite(parsedSplitDistance) || parsedSplitDistance < 50 || parsedSplitDistance > 100_000;

  const unchanged =
    nameDraft.trim() === profile.name &&
    parsedYearOfBirth === profile.year_of_birth &&
    JSON.stringify(thresholdDraft) === JSON.stringify(profile.default_stretch_thresholds) &&
    distanceUnitDraft === profile.distance_unit &&
    parsedSplitDistance === profile.split_distance_m;

  const handleSave = async () => {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: profile.id,
        name: nameDraft.trim(),
        year_of_birth: parsedYearOfBirth,
        default_stretch_thresholds: thresholdDraft,
        distance_unit: distanceUnitDraft,
        split_distance_m: parsedSplitDistance,
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
            disabled={
              updateMutation.isPending ||
              !nameDraft.trim() ||
              unchanged ||
              yearOfBirthInvalid ||
              splitDistanceInvalid
            }
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
          if (!nameDraft.trim() || unchanged || splitDistanceInvalid) return;
          void handleSave();
        }}
      >
        {error && <ErrorText>{error}</ErrorText>}
        <Field label="Name">
          <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus />
        </Field>

        <Field
          label="Year of birth"
          description={
            estimatedMaxHr != null
              ? `Estimated max HR: ${estimatedMaxHr} bpm (220 − age). Used for heart-rate zone lines on charts.`
              : "Set your birth year to show heart-rate zones on activity charts."
          }
        >
          <Input
            type="number"
            inputMode="numeric"
            min={1900}
            max={new Date().getFullYear()}
            placeholder="e.g. 1985"
            value={yearOfBirthDraft}
            onChange={(e) => setYearOfBirthDraft(e.target.value)}
          />
        </Field>

        <CollapsibleSection
          variant="card"
          headingLevel="h3"
          title="Activity split defaults"
          expanded={splitDefaultsExpanded}
          onToggle={() => setSplitDefaultsExpanded((value) => !value)}
        >
          <div className="flex flex-col gap-2">
            <Select
              value={distanceUnitDraft}
              onChange={(event) => {
                const nextUnit = event.target.value as DistanceUnit;
                setSplitDistanceDraft(String(splitDistanceInUnit(parsedSplitDistance, nextUnit)));
                setDistanceUnitDraft(nextUnit);
              }}
            >
              <option value="km">Kilometres</option>
              <option value="mi">Miles</option>
            </Select>
            <Field
              label={`Split every (${distanceUnitDraft})`}
              className="gap-1"
              labelClassName="text-xs"
            >
              <Input
                type="number"
                inputMode="decimal"
                min={0.1}
                max={distanceUnitDraft === "mi" ? 62 : 100}
                step={0.05}
                value={splitDistanceDraft}
                onChange={(event) => setSplitDistanceDraft(event.target.value)}
              />
            </Field>
            <span className="text-xs text-muted">
              Choose any distance—for example 0.5 km or 1.7 mi. Splits are derived from the GPS track when an import has no laps.
            </span>
          </div>
        </CollapsibleSection>

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
