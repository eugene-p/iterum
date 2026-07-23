import type { ReactNode } from "react";
import type { TrackPoint } from "../../../types";
import {
  RouteExplorerMap,
  type ExplorerMarker,
  type StretchOverlay,
} from "../../maps/RouteExplorerMap/RouteExplorerMap";
import { routeExplorerStyles } from "../RouteExplorer/RouteExplorer.styles";

type CompareMapStageProps = {
  routePoints: TrackPoint[];
  highlightPoints?: TrackPoint[];
  stretchOverlays?: StretchOverlay[];
  markers: ExplorerMarker[];
  clickableRoute?: TrackPoint[];
  onPositionClick?: (index: number) => void;
  legendLabel: string;
  children: ReactNode;
};

export const CompareMapStage = ({
  routePoints,
  highlightPoints = [],
  stretchOverlays = [],
  markers,
  clickableRoute,
  onPositionClick,
  legendLabel,
  children,
}: CompareMapStageProps) => (
  <div className={routeExplorerStyles.mapStage}>
    <div className={routeExplorerStyles.mapWrap}>
      <RouteExplorerMap
        routePoints={routePoints}
        highlightPoints={highlightPoints}
        stretchOverlays={stretchOverlays}
        markers={markers}
        onPositionClick={onPositionClick}
        clickableRoute={clickableRoute}
      />
    </div>
    <aside className={routeExplorerStyles.legend} aria-label={legendLabel}>
      {children}
    </aside>
  </div>
);
