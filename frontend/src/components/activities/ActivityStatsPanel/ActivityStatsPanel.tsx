import { useProfileContext } from "../../../app/ProfileContext";
import { formatTags } from "../../../lib/formatTags";
import { profileMaxHr } from "../../../lib/hrZones";
import { useActivityMatchedSegmentsQuery } from "../../../queries/activities";
import type { ActivitySummary, TrackPoint } from "../../../types";
import {
  formatDistance,
  formatDuration,
  formatHr,
  formatPaceFromSpeed,
  formatSpeed,
} from "../../../utils";
import { Badge, MutedSpan } from "../../ui";
import { ActivityTrackChart } from "../ActivityTrackChart";
import { activityAvgSpeedKmh } from "../ActivitiesPanel/activitiesPanelUtils";
import { activityStatsPanelStyles } from "./ActivityStatsPanel.styles";

type ActivityStatsPanelProps = {
  activity: ActivitySummary;
  trackPoints?: TrackPoint[];
  onSelectSegment: (segmentId: number) => void;
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className={activityStatsPanelStyles.statRow}>
    <span className={activityStatsPanelStyles.statLabel}>{label}</span>
    <span className={activityStatsPanelStyles.statValue}>{value}</span>
  </div>
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
  const avgSpeed = activityAvgSpeedKmh(activity);
  const zoneMaxHr = profileMaxHr(profiles.find((profile) => profile.id === activity.profile_id));
  const matchedSegmentsQuery = useActivityMatchedSegmentsQuery(activity.id);
  const matchedSegments = matchedSegmentsQuery.data ?? [];
  const hasHrTrack = (trackPoints ?? []).some((point) => point.heart_rate != null);

  const summaryLine = joinMeta([
    formatDistance(activity.distance_m),
    formatDuration(activity.duration_sec),
    activity.avg_hr != null ? formatHr(activity.avg_hr) : null,
  ]);

  const contextMeta = joinMeta([
    activity.location,
    activity.sport,
    activity.source_format.toUpperCase(),
    activity.profile_name,
  ]);

  return (
    <aside className={activityStatsPanelStyles.root}>
      {activity.tags?.length ? (
        <div className={activityStatsPanelStyles.section}>
          <div className={activityStatsPanelStyles.sectionTitle}>Tags</div>
          <div className={activityStatsPanelStyles.tagRow}>
            {activity.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
      ) : null}

      {summaryLine ? (
        <div className={activityStatsPanelStyles.summaryLine}>{summaryLine}</div>
      ) : null}

      <div className={activityStatsPanelStyles.section}>
        <div className={activityStatsPanelStyles.statList}>
          <Stat label="Avg speed" value={formatSpeed(avgSpeed)} />
          <Stat label="Avg pace" value={formatPaceFromSpeed(avgSpeed)} />
          <Stat label="Max HR" value={formatHr(activity.max_hr)} />
        </div>
      </div>

      {hasHrTrack && trackPoints ? (
        <ActivityTrackChart
          points={trackPoints}
          maxHr={zoneMaxHr}
          durationSec={activity.duration_sec}
          expandable
          expandTitle={`${activity.name} — heart rate & elevation`}
        />
      ) : null}

      {contextMeta ? <div className={activityStatsPanelStyles.metaLine}>{contextMeta}</div> : null}
      <div className={activityStatsPanelStyles.metaLine} title={activity.source_filename}>
        {activity.source_filename} · {activity.point_count.toLocaleString()} pts
      </div>

      <div className={activityStatsPanelStyles.section}>
        <div className={activityStatsPanelStyles.sectionTitle}>
          Matched segments
          {matchedSegments.length ? (
            <MutedSpan> ({matchedSegments.length})</MutedSpan>
          ) : null}
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
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};