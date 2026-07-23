import { useCallback, useState } from "react";
import { Modal, ModalHeader } from "../../../ui";
import { activityTrackChartStyles } from "../../../activities/ActivityTrackChart/ActivityTrackChart.styles";
import {
  PassCompareTrackChartView,
  type PassCompareTrackChartViewProps,
} from "./PassCompareTrackChartView";

type PassCompareTrackChartProps = PassCompareTrackChartViewProps & {
  expandable?: boolean;
  expandTitle?: string;
};

export const PassCompareTrackChart = ({
  expandable = false,
  expandTitle = "Heart rate & elevation",
  size = "compact",
  chartOverlay,
  ...viewProps
}: PassCompareTrackChartProps) => {
  const [expanded, setExpanded] = useState(false);

  const openExpanded = useCallback(() => setExpanded(true), []);
  const closeExpanded = useCallback(() => setExpanded(false), []);

  if (!expandable) {
    return <PassCompareTrackChartView size={size} chartOverlay={chartOverlay} {...viewProps} />;
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
      <PassCompareTrackChartView
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
          <PassCompareTrackChartView size="large" chartOverlay={chartOverlay} {...viewProps} />
        </div>
      </Modal>
    </>
  );
};
