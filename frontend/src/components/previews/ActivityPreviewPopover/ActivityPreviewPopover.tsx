import { RoutePreviewPopover } from "../shared/RoutePreviewPopover";

type ActivityPreviewPopoverProps = {
  activityId: number;
  activityName: string;
  anchorRect: DOMRect | null;
};

export const ActivityPreviewPopover = ({
  activityId,
  activityName,
  anchorRect,
}: ActivityPreviewPopoverProps) => {
  return (
    <RoutePreviewPopover
      title={activityName}
      anchorRect={anchorRect}
      ariaLabel={`Route preview for ${activityName}`}
      previewUrl={`/api/activities/${activityId}/preview.jpg`}
    />
  );
};