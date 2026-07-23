import { RoutePreviewPopover } from "../../previews/shared/RoutePreviewPopover";

type SegmentPreviewPopoverProps = {
  segmentId: number;
  segmentName: string;
  anchorRect: DOMRect | null;
};

export const SegmentPreviewPopover = ({
  segmentId,
  segmentName,
  anchorRect,
}: SegmentPreviewPopoverProps) => {
  return (
    <RoutePreviewPopover
      title={segmentName}
      anchorRect={anchorRect}
      ariaLabel={`Segment preview for ${segmentName}`}
      previewUrl={`/api/segments/${segmentId}/preview.jpg`}
    />
  );
};