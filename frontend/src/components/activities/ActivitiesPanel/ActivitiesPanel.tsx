import { useMemo, useRef, useState } from "react";
import { useProfileContext } from "../../../app/ProfileContext";
import {
  formatActivityDate,
  formatActivityTime,
  resolveActivityDateTime,
} from "../../../activityDisplay";
import { CollapsibleSection, Input, Select, Stack } from "../../ui";
import type { ActivitySummary } from "../../../types";
import { formatSidebarListCount } from "../../AppSidebar/sidebarListUtils";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";
import { SidebarFilterSection, SidebarListButton } from "../../AppSidebar";
import { ProfileScopeHint } from "../../profiles/ProfileScopeHint";
import { ActivityPreviewPopover } from "../../previews/ActivityPreviewPopover";
import { useActivityRouteSamplesMapQuery } from "../../../queries/activityRouteSamples";
import { ActivityUploadControl } from "../ActivityUploadControl";
import { activitiesPanelStyles } from "./ActivitiesPanel.styles";
import {
  ACTIVITY_LIST_SORT_OPTIONS,
  ACTIVITIES_BROWSE_MODE_OPTIONS,
  activityContextLine,
  activityDayKey,
  activityDayStripeFlags,
  activityListFiltersAreActive,
  activityListFiltersSummary,
  activityStatsLine,
  buildActivityDensity,
  canSlideDensityEarlier,
  clusterActivitiesByRoute,
  DEFAULT_ACTIVITY_LIST_SORT,
  densityLevel,
  densityWeekRows,
  densityWindowEnd,
  filterAndSortActivitiesBySearch,
  formatActivityDayLabel,
  formatDensityWindowLabel,
  groupActivitiesByWeek,
  routeClusterMetaLine,
  type ActivitiesBrowseMode,
  type ActivityListSort,
} from "./activitiesPanelUtils";

type ActivitiesPanelProps = {
  activities: ActivitySummary[];
  selectedActivityId: number | null;
  onSelectActivity: (id: number) => void;
  onRefresh: () => Promise<void>;
  onActivityJobsEnqueued?: () => void;
};

type PreviewState = {
  id: number;
  name: string;
  rect: DOMRect;
};

export const ActivitiesPanel = ({
  activities,
  selectedActivityId,
  onSelectActivity,
  onRefresh,
  onActivityJobsEnqueued,
}: ActivitiesPanelProps) => {
  const { activeProfileId, viewScope } = useProfileContext();
  const viewingAll = viewScope === "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<ActivityListSort>(DEFAULT_ACTIVITY_LIST_SORT);
  const [browseMode, setBrowseMode] = useState<ActivitiesBrowseMode>("timeline");
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  /** 0 = window ending today; each step slides one week earlier. */
  const [densityOffsetWeeks, setDensityOffsetWeeks] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const searchedActivities = useMemo(
    () => filterAndSortActivitiesBySearch(activities, searchQuery, sort),
    [activities, searchQuery, sort],
  );

  const filteredActivities = useMemo(() => {
    if (!dayFilter) return searchedActivities;
    return searchedActivities.filter((activity) => activityDayKey(activity) === dayFilter);
  }, [searchedActivities, dayFilter]);

  const weekGroups = useMemo(
    () => groupActivitiesByWeek(filteredActivities, sort),
    [filteredActivities, sort],
  );

  // Density follows search (not day filter) so heat matches what a day click can show.
  const densityEnd = useMemo(() => densityWindowEnd(densityOffsetWeeks), [densityOffsetWeeks]);
  const densityCells = useMemo(
    () => buildActivityDensity(searchedActivities, { endDate: densityEnd }),
    [searchedActivities, densityEnd],
  );
  const densityRows = useMemo(() => densityWeekRows(densityCells), [densityCells]);
  const densityMax = useMemo(
    () => densityCells.reduce((max, cell) => Math.max(max, cell.count), 0),
    [densityCells],
  );
  const densityRangeLabel = useMemo(
    () => formatDensityWindowLabel(densityCells),
    [densityCells],
  );
  const canDensityEarlier = useMemo(
    () => canSlideDensityEarlier(searchedActivities, densityOffsetWeeks),
    [searchedActivities, densityOffsetWeeks],
  );

  const filteredActivityIds = useMemo(
    () => filteredActivities.map((activity) => activity.id),
    [filteredActivities],
  );

  const routeSampleQuery = useActivityRouteSamplesMapQuery(
    filteredActivityIds,
    browseMode === "route",
  );

  const routeClusters = useMemo(() => {
    if (browseMode !== "route") return null;
    if (routeSampleQuery.isLoading) return null;
    return clusterActivitiesByRoute(filteredActivities, routeSampleQuery.data);
  }, [browseMode, filteredActivities, routeSampleQuery.data, routeSampleQuery.isLoading]);

  const sortLabel =
    ACTIVITY_LIST_SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest";
  const dayFilterLabel =
    dayFilter != null ? formatActivityDayLabel(dayFilter) : null;
  const filtersActive = activityListFiltersAreActive(
    sort === DEFAULT_ACTIVITY_LIST_SORT,
    searchQuery,
    browseMode,
    dayFilter,
  );
  const filtersSummary = activityListFiltersSummary(
    sortLabel,
    searchQuery,
    browseMode,
    dayFilterLabel,
  );
  const countLabel = formatSidebarListCount(
    filteredActivities.length,
    activities.length,
    "activity",
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

  const onSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) setFiltersOpen(true);
  };

  const toggleDayFilter = (dayKey: string) => {
    setDayFilter((current) => (current === dayKey ? null : dayKey));
  };

  const isClusterExpanded = (clusterId: string) => expandedClusters[clusterId] !== false;

  const toggleCluster = (clusterId: string) => {
    setExpandedClusters((current) => {
      const expanded = current[clusterId] !== false;
      return { ...current, [clusterId]: !expanded };
    });
  };

  const renderActivityRow = (activity: ActivitySummary, dayStripe = false) => {
    const resolved = resolveActivityDateTime({
      started_at: activity.started_at,
      created_at: activity.created_at,
      name: activity.name,
      source_filename: activity.source_filename,
    });
    const dateTimeLabel = resolved
      ? `${formatActivityDate(resolved.at)} · ${formatActivityTime(resolved.at, resolved.hasTime)}`
      : "— · —";
    const stats = activityStatsLine(activity);
    const context = activityContextLine(activity);

    return (
      <li key={activity.id}>
        <SidebarListButton
          selected={selectedActivityId === activity.id}
          className={activitiesPanelStyles.listItem(dayStripe)}
          onClick={() => onSelectActivity(activity.id)}
          onMouseEnter={(e) => schedulePreview(activity, e.currentTarget)}
          onMouseLeave={clearPreview}
        >
          <div className={activitiesPanelStyles.itemPrimaryRow} title={`${dateTimeLabel} · ${activity.name}`}>
            <span className={activitiesPanelStyles.itemDateTime}>{dateTimeLabel}</span>
            <span className={activitiesPanelStyles.itemSep} aria-hidden>
              |
            </span>
            <span className={activitiesPanelStyles.itemName}>{activity.name}</span>
            {viewingAll && (
              <span className={activitiesPanelStyles.itemProfile} title={activity.profile_name}>
                {activity.profile_name}
              </span>
            )}
          </div>
          {stats && (
            <div className={activitiesPanelStyles.itemStats} title={stats}>
              {stats}
            </div>
          )}
          {context && (
            <div className={activitiesPanelStyles.itemContext} title={context}>
              {context}
            </div>
          )}
        </SidebarListButton>
      </li>
    );
  };

  const renderTimelineList = () => {
    if (filteredActivities.length === 0) {
      return (
        <ul className={sidebarListStyles.list}>
          <li className={sidebarListStyles.listEmpty}>
            {activities.length === 0 ? "No activities yet." : "No matches."}
          </li>
        </ul>
      );
    }

    return (
      <div>
        {weekGroups.map((group) => {
          const stripes = activityDayStripeFlags(group.activities);
          return (
            <div key={group.weekKey}>
              <div className={activitiesPanelStyles.weekHeader}>
                {group.label}{" "}
                <span className={activitiesPanelStyles.weekHeaderCount}>
                  · {group.activities.length}
                </span>
              </div>
              <ul className={sidebarListStyles.list}>
                {group.activities.map((activity, index) =>
                  renderActivityRow(activity, stripes[index] ?? false),
                )}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRouteList = () => {
    if (filteredActivities.length === 0) {
      return (
        <ul className={sidebarListStyles.list}>
          <li className={sidebarListStyles.listEmpty}>
            {activities.length === 0 ? "No activities yet." : "No matches."}
          </li>
        </ul>
      );
    }

    if (routeSampleQuery.isLoading) {
      return (
        <div className={activitiesPanelStyles.clusterLoading}>Grouping similar routes…</div>
      );
    }

    if (!routeClusters) {
      return (
        <div className={activitiesPanelStyles.clusterLoading}>Could not load route samples.</div>
      );
    }

    return (
      <div>
        {routeClusters.map((cluster) => {
          const multi = cluster.activities.length > 1;
          const stripes = activityDayStripeFlags(cluster.activities);
          if (!multi) {
            return (
              <ul key={cluster.id} className={sidebarListStyles.list}>
                {cluster.activities.map((activity, index) =>
                  renderActivityRow(activity, stripes[index] ?? false),
                )}
              </ul>
            );
          }

          return (
            <CollapsibleSection
              key={cluster.id}
              className={activitiesPanelStyles.cluster}
              headerClassName={activitiesPanelStyles.clusterHeader}
              titleClassName={activitiesPanelStyles.clusterTitle}
              bodyClassName={activitiesPanelStyles.clusterBody}
              headingLevel="h3"
              expanded={isClusterExpanded(cluster.id)}
              onToggle={() => toggleCluster(cluster.id)}
              title={
                <span>
                  <span className={activitiesPanelStyles.clusterTitleText} title={cluster.title}>
                    {cluster.title}
                  </span>
                  <span className={activitiesPanelStyles.clusterMeta}>
                    {routeClusterMetaLine(cluster)}
                  </span>
                </span>
              }
            >
              <ul className={sidebarListStyles.list}>
                {cluster.activities.map((activity, index) =>
                  renderActivityRow(activity, stripes[index] ?? false),
                )}
              </ul>
            </CollapsibleSection>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className={activitiesPanelStyles.root}>
        <div className={activitiesPanelStyles.body}>
          <Stack>
            <SidebarFilterSection
              countLabel={countLabel}
              summary={filtersSummary}
              active={filtersActive}
              expanded={filtersOpen}
              onToggle={() => setFiltersOpen((open) => !open)}
            >
              <Input
                className={sidebarListStyles.search}
                type="search"
                placeholder="Search tags, name, profile…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search activities"
              />

              <div className={activitiesPanelStyles.modeRow} role="group" aria-label="Browse mode">
                {ACTIVITIES_BROWSE_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={activitiesPanelStyles.modeButton(browseMode === option.value)}
                    aria-pressed={browseMode === option.value}
                    onClick={() => setBrowseMode(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {browseMode === "timeline" && (
                <div className={activitiesPanelStyles.sortRow}>
                  <label className={activitiesPanelStyles.sortLabel} htmlFor="activity-list-sort">
                    Sort
                  </label>
                  <Select
                    id="activity-list-sort"
                    className={activitiesPanelStyles.sortSelect}
                    value={sort}
                    onChange={(e) => setSort(e.target.value as ActivityListSort)}
                  >
                    {ACTIVITY_LIST_SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </SidebarFilterSection>

            {activities.length > 0 && (
              <div className={activitiesPanelStyles.density}>
                <div className={activitiesPanelStyles.densityChrome}>
                  <button
                    type="button"
                    className={activitiesPanelStyles.densityNav}
                    aria-label="Earlier two weeks"
                    disabled={!canDensityEarlier}
                    onClick={() => {
                      if (canDensityEarlier) setDensityOffsetWeeks((n) => n + 1);
                    }}
                  >
                    ‹
                  </button>
                  <span className={activitiesPanelStyles.densityRange} title={densityRangeLabel}>
                    {densityRangeLabel}
                  </span>
                  <button
                    type="button"
                    className={activitiesPanelStyles.densityNav}
                    aria-label="Later two weeks"
                    disabled={densityOffsetWeeks <= 0}
                    onClick={() => setDensityOffsetWeeks((n) => Math.max(0, n - 1))}
                  >
                    ›
                  </button>
                </div>
                <div
                  className={activitiesPanelStyles.densityWeeks}
                  role="group"
                  aria-label={`Activity density ${densityRangeLabel}`}
                >
                  {densityRows.map((row, rowIndex) => (
                    <div
                      key={row[0]?.dayKey ?? rowIndex}
                      className={activitiesPanelStyles.densityWeekRow}
                    >
                      {row.map((cell) => {
                        const level = densityLevel(cell.count, densityMax);
                        const selected = dayFilter === cell.dayKey;
                        const empty = cell.count === 0;
                        const label = `${formatActivityDayLabel(cell.dayKey)}: ${cell.count} ${
                          cell.count === 1 ? "activity" : "activities"
                        }`;
                        return (
                          <button
                            key={cell.dayKey}
                            type="button"
                            className={activitiesPanelStyles.densityCell(level, selected, empty)}
                            title={label}
                            aria-label={label}
                            aria-pressed={selected}
                            disabled={empty}
                            onClick={() => {
                              if (!empty) toggleDayFilter(cell.dayKey);
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className={activitiesPanelStyles.densityHint}>
                  2 weeks · darker = more · click a day · arrows slide back
                </div>
              </div>
            )}

            {dayFilter && (
              <div className={activitiesPanelStyles.dayFilterChip}>
                <span>Day: {formatActivityDayLabel(dayFilter)}</span>
                <button
                  type="button"
                  className={activitiesPanelStyles.dayFilterClear}
                  onClick={() => setDayFilter(null)}
                >
                  Clear
                </button>
              </div>
            )}

            <ProfileScopeHint />

            {browseMode === "timeline" ? renderTimelineList() : renderRouteList()}
          </Stack>
        </div>

        {activeProfileId != null && (
          <div className={activitiesPanelStyles.footer}>
            <ActivityUploadControl
              variant="footer"
              profileId={activeProfileId}
              onRefresh={onRefresh}
              onActivityJobsEnqueued={onActivityJobsEnqueued}
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
