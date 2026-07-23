import { useMemo, useRef, useState } from "react";
import type { Segment } from "../../../types";
import { ProfileScopeHint } from "../../profiles/ProfileScopeHint";
import { Stack } from "../../ui";
import { SidebarListToolbar } from "../../AppSidebar/SidebarListToolbar";
import { sidebarListStyles } from "../../AppSidebar/sidebarList.styles";
import { SegmentPreviewPopover } from "../SegmentPreviewPopover";
import {
  filterAndSortSegmentsBySearch,
  segmentMetaLine,
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
  const [preview, setPreview] = useState<{
    id: number;
    name: string;
    rect: DOMRect;
  } | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const visibleSegments = useMemo(
    () => filterAndSortSegmentsBySearch(segments, searchQuery),
    [segments, searchQuery],
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

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Stack>
          <SidebarListToolbar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tags, name…"
          visibleCount={visibleSegments.length}
          totalCount={segments.length}
          itemNoun="segment"
        />

        <ProfileScopeHint />

        <ul className={sidebarListStyles.list}>
          {visibleSegments.length === 0 && (
            <li className={sidebarListStyles.listEmpty}>
              {segments.length === 0
                ? "No segments yet — create one from an activity."
                : "No matches."}
            </li>
          )}
          {visibleSegments.map((segment) => (
            <li
              key={segment.id}
              className={sidebarListStyles.listItem(
                selectedSegmentId === segment.id,
              )}
              onClick={() => onSelectSegment(segment.id)}
              onMouseEnter={(e) => schedulePreview(segment, e.currentTarget)}
              onMouseLeave={clearPreview}
            >
              <div className={sidebarListStyles.itemName} title={segment.name}>
                {segment.name}
              </div>
              <div className={sidebarListStyles.itemMeta}>{segmentMetaLine(segment)}</div>
            </li>
          ))}
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