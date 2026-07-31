import { useProfileContext } from "../../../app/ProfileContext";
import { useAppWorkspace } from "../../../app/useAppWorkspaceContext";
import { formatTags } from "../../../lib/formatTags";
import { profileMaxHr } from "../../../lib/hrZones";
import { useActivityMatchedSegmentsQuery } from "../../../queries/activities";
import type { ActivitySummary, TrackPoint } from "../../../types";
import {
  formatHr,
  formatPaceFromSpeed,
  formatSpeed,
} from "../../../utils";
import { Badge, MutedSpan } from "../../ui";
import { ActivityTrackChart } from "../ActivityTrackChart";
import { ActivitySplits } from "../ActivitySplits";
import { HrZoneTimeSummary } from "../ActivityTrackChart/HrZoneTimeSummary";
import { activityAvgSpeedKmh } from "../ActivitiesPanel/activitiesPanelUtils";
import { activityStatsPanelStyles } from "./ActivityStatsPanel.styles";

type ActivityStatsPanelProps = {
  activity: ActivitySummary;
  trackPoints?: TrackPoint[];
  onSelectSegment: (segmentId: number) => void;
};

const InlineStat = ({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title: string;
}) => (
  <span className={activityStatsPanelStyles.statInline} title={title}>
    <span className={activityStatsPanelStyles.statLabel}>{label}</span>
    <span className={activityStatsPanelStyles.statValue}>{value}</span>
  </span>
);

const joinMeta = (parts: Array<string | null | undefined>): string | null => {
  const filtered = parts.filter(Boolean);
  return filtered.length ? filtered.join(" · ") : null;
};

export const ActivityStatsPanel = ({
  activity,
  trackPoints,
  onSelectSegment,
}: ActivityStatsPanelProps) => {
  const { profiles } = useProfileContext();
  const { expandSidebar, setSidebarTab } = useAppWorkspace();
  const avgSpeed = activityAvgSpeedKmh(activity);
  const activityProfile = profiles.find((profile) => profile.id === activity.profile_id);
  const zoneMaxHr = profileMaxHr(activityProfile);
  const matchedSegmentsQuery = useActivityMatchedSegmentsQuery(activity.id);
  const matchedSegments = matchedSegmentsQuery.data ?? [];
  const hasHrTrack = (trackPoints ?? []).some((point) => point.heart_rate != null);
  const elevationGain = (trackPoints ?? []).reduce((gain, point, index, points) => {
    const previousElevation = index > 0 ? points[index - 1]?.elevation_m : null;
    if (point.elevation_m == null || previousElevation == null) return gain;
    return gain + Math.max(0, point.elevation_m - previousElevation);
  }, 0);

  const elevationLabel = elevationGain ? `${Math.round(elevationGain)} m` : "—";
  const contextMeta = joinMeta([
    activity.location,
    activity.sport,
    activity.source_format.toUpperCase(),
    activity.profile_name,
  ]);

  const tags = activity.tags ?? [];

  return (
    <aside className={activityStatsPanelStyles.root}>
      <section className={activityStatsPanelStyles.analysisSection} aria-labelledby="activity-effort-title">
        <div className={activityStatsPanelStyles.sectionHeader}>
          <h2 id="activity-effort-title" className={activityStatsPanelStyles.sectionTitle}>
            Effort & elevation
          </h2>
          {contextMeta ? (
            <span className={activityStatsPanelStyles.sectionMeta}>{contextMeta}</span>
          ) : null}
        </div>
        {tags.length > 0 ? (
          <div className={activityStatsPanelStyles.sectionTags}>
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
        <div className={activityStatsPanelStyles.statLine}>
          <InlineStat label="Speed" value={formatSpeed(avgSpeed)} title="Average speed" />
          <InlineStat label="Pace" value={formatPaceFromSpeed(avgSpeed)} title="Average pace" />
          <InlineStat label="Avg HR" value={formatHr(activity.avg_hr)} title="Average heart rate" />
          <InlineStat label="Max HR" value={formatHr(activity.max_hr)} title="Maximum heart rate" />
          <InlineStat label="Elev" value={elevationLabel} title="Elevation gain" />
        </div>

        {hasHrTrack && trackPoints ? (
          <ActivityTrackChart
            points={trackPoints}
            maxHr={zoneMaxHr}
            durationSec={activity.duration_sec}
            expandable
            showZoneSummary={false}
            expandTitle={`${activity.name} — heart rate & elevation`}
          />
        ) : null}
        {hasHrTrack && trackPoints && zoneMaxHr != null ? (
          <div className={activityStatsPanelStyles.zoneSummary}>
            <span className={activityStatsPanelStyles.zoneSummaryLabel}>Time in HR zones</span>
            <HrZoneTimeSummary
              series={[{ points: trackPoints, durationSec: activity.duration_sec }]}
              maxHr={zoneMaxHr}
            />
          </div>
        ) : null}
      </section>

      <ActivitySplits
        points={trackPoints}
        profile={activityProfile}
        onOpenProfileSettings={() => {
          setSidebarTab("profile");
          expandSidebar();
        }}
      />

      <section className={activityStatsPanelStyles.analysisSection}>
        <div className={activityStatsPanelStyles.segmentHeading}>
          <div className={activityStatsPanelStyles.sectionTitle}>
            Matched segments
          {matchedSegments.length ? (
            <MutedSpan> ({matchedSegments.length})</MutedSpan>
          ) : null}
          </div>
          {matchedSegments.length ? <span className={activityStatsPanelStyles.segmentHint}>Open comparison</span> : null}
        </div>
        {matchedSegmentsQuery.isLoading ? (
          <div className={activityStatsPanelStyles.emptyHint}>Loading…</div>
        ) : matchedSegments.length === 0 ? (
          <div className={activityStatsPanelStyles.emptyHint}>No matched segments yet.</div>
        ) : (
          <ul className={activityStatsPanelStyles.segmentList}>
            {matchedSegments.map((segment) => {
              const meta = joinMeta([
                formatTags(segment.tags),
                segment.location,
                segment.pass_count === 1
                  ? "1 pass"
                  : `${segment.pass_count} passes`,
              ]);
              return (
                <li key={segment.id}>
                  <button
                    type="button"
                    className={activityStatsPanelStyles.segmentItem}
                    onClick={() => onSelectSegment(segment.id)}
                  >
                    <div className={activityStatsPanelStyles.segmentName} title={segment.name}>
                      {segment.name}
                    </div>
                    {meta ? (
                      <div className={activityStatsPanelStyles.segmentMeta}>{meta}</div>
                    ) : null}
                    <span className={activityStatsPanelStyles.segmentAction}>View segment <span aria-hidden>→</span></span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className={activityStatsPanelStyles.metaLine} title={activity.source_filename}>
        {activity.source_filename} · {activity.point_count.toLocaleString()} pts
      </div>
    </aside>
  );
};
