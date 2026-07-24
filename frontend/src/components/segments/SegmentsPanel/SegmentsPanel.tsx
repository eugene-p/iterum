import { useMemo, useRef, useState } from "react";
import type { Segment } from "../../../types";
import { formatSidebarListCount } from "../../AppSidebar/sidebarListUtils";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";
import { ProfileScopeHint } from "../../profiles/ProfileScopeHint";
import { CollapsibleSection, Input, Stack } from "../../ui";
import { SegmentPreviewPopover } from "../SegmentPreviewPopover";
import { segmentsPanelStyles } from "./SegmentsPanel.styles";
import {
  DEFAULT_SEGMENT_LIST_SORT,
  filterAndSortSegmentsBySearch,
  SEGMENT_LIST_SORT_OPTIONS,
  segmentContextMetaLine,
  segmentFiltersAreActive,
  segmentFiltersSummary,
  segmentMatchMetaLine,
  type SegmentListSort,
} from "./segmentsPanelUtils";

type SegmentsPanelProps = {
  segments: Segment[];
  selectedSegmentId: number | null;
  onSelectSegment: (id: number) => void;
};

export const SegmentsPanel = ({
  segments,
  selectedSegmentId,
  onSelectSegment,
}: SegmentsPanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SegmentListSort>(DEFAULT_SEGMENT_LIST_SORT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [preview, setPreview] = useState<{
    id: number;
    name: string;
    rect: DOMRect;
  } | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const visibleSegments = useMemo(
    () => filterAndSortSegmentsBySearch(segments, searchQuery, sort),
    [segments, searchQuery, sort],
  );

  const filtersActive = segmentFiltersAreActive(sort, searchQuery);
  const filtersSummary = segmentFiltersSummary(sort, searchQuery);
  const countLabel = formatSidebarListCount(
    visibleSegments.length,
    segments.length,
    "segment",
  );

  const schedulePreview = (segment: Segment, element: HTMLElement) => {
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => {
      setPreview({
        id: segment.id,
        name: segment.name,
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

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Stack className="gap-1.5">
          <CollapsibleSection
            className={segmentsPanelStyles.filters}
            headerClassName={segmentsPanelStyles.filtersHeader}
            titleClassName={segmentsPanelStyles.filtersTitle}
            bodyClassName={segmentsPanelStyles.filtersBody}
            title={
              <span className={segmentsPanelStyles.filtersTitleRow}>
                <span
                  className={segmentsPanelStyles.filtersCount(filtersActive)}
                >
                  {countLabel}
                </span>
                <span className={segmentsPanelStyles.filtersSep} aria-hidden="true">
                  |
                </span>
                <span
                  className={segmentsPanelStyles.filtersSort(filtersActive)}
                  title={filtersSummary}
                >
                  {filtersSummary}
                </span>
              </span>
            }
            headingLevel="h3"
            expanded={filtersOpen}
            onToggle={() => setFiltersOpen((open) => !open)}
          >
            <Input
              className={sidebarListStyles.search}
              type="search"
              placeholder="Search tags, name…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search segments"
            />
            <div className={segmentsPanelStyles.sortRow}>
              <label className={segmentsPanelStyles.sortLabel} htmlFor="segment-list-sort">
                Sort
              </label>
              <select
                id="segment-list-sort"
                className={segmentsPanelStyles.sortSelect}
                value={sort}
                onChange={(e) => setSort(e.target.value as SegmentListSort)}
              >
                {SEGMENT_LIST_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CollapsibleSection>

          <ProfileScopeHint />

          <ul className={sidebarListStyles.list}>
            {visibleSegments.length === 0 && (
              <li className={sidebarListStyles.listEmpty}>
                {segments.length === 0
                  ? "No segments yet — create one from an activity."
                  : "No matches."}
              </li>
            )}
            {visibleSegments.map((segment, index) => {
              const hero = index === 0;
              const context = segmentContextMetaLine(segment);
              return (
                <li
                  key={segment.id}
                  className={segmentsPanelStyles.listItem(
                    selectedSegmentId === segment.id,
                    hero,
                  )}
                  onClick={() => onSelectSegment(segment.id)}
                  onMouseEnter={(e) => schedulePreview(segment, e.currentTarget)}
                  onMouseLeave={clearPreview}
                >
                  <div
                    className={segmentsPanelStyles.itemName(hero)}
                    title={segment.name}
                  >
                    {segment.name}
                  </div>
                  <div className={segmentsPanelStyles.matchMeta(hero)}>
                    {segmentMatchMetaLine(segment)}
                  </div>
                  {context && (
                    <div className={segmentsPanelStyles.contextMeta} title={context}>
                      {context}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Stack>
      </div>

      {preview && (
        <SegmentPreviewPopover
          segmentId={preview.id}
          segmentName={preview.name}
          anchorRect={preview.rect}
        />
      )}
    </>
  );
};
