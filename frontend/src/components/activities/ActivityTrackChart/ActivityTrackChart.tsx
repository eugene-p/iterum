import { useCallback, useState } from "react";
import { Modal, ModalHeader } from "../../ui";
import { activityTrackChartStyles } from "./ActivityTrackChart.styles";
import { ActivityTrackChartView, type ActivityTrackChartViewProps } from "./ActivityTrackChartView";

type ActivityTrackChartProps = ActivityTrackChartViewProps & {
  expandable?: boolean;
  expandTitle?: string;
};

export const ActivityTrackChart = ({
  expandable = false,
  expandTitle = "Heart rate & elevation",
  size = "compact",
  chartOverlay,
  ...viewProps
}: ActivityTrackChartProps) => {
  const [expanded, setExpanded] = useState(false);

  const openExpanded = useCallback(() => setExpanded(true), []);
  const closeExpanded = useCallback(() => setExpanded(false), []);

  if (!expandable) {
    return <ActivityTrackChartView size={size} chartOverlay={chartOverlay} {...viewProps} />;
  }

  const expandButton = (
    <button
      type="button"
      className={activityTrackChartStyles.expandButton}
      onClick={openExpanded}
      aria-label="Expand heart rate and elevation chart"
    >
      Expand
    </button>
  );

  return (
    <>
      <ActivityTrackChartView
        size="compact"
        chartOverlay={
          <>
            {chartOverlay}
            {expandButton}
          </>
        }
        {...viewProps}
      />

      <Modal
        open={expanded}
        onClose={closeExpanded}
        panelClassName={activityTrackChartStyles.modalPanel}
      >
        <ModalHeader title={expandTitle} onClose={closeExpanded} />
        <div className={activityTrackChartStyles.modalBody}>
          <ActivityTrackChartView size="large" chartOverlay={chartOverlay} {...viewProps} />
        </div>
      </Modal>
    </>
  );
};
