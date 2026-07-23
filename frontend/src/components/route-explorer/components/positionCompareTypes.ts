import type { metricsAtIndex, ExplorerPassSlice } from "../../../routeExplorerUtils";
import type { StretchPointContext } from "../../../stretchUtils";
import type { SegmentPass, Stretch, TrackPoint } from "../../../types";
import type { ExplorerMarker, StretchOverlay } from "../../maps/RouteExplorerMap/RouteExplorerMap";

export type PositionPassRow = {
  slice: ExplorerPassSlice;
  index: number;
  color: string;
  positionColor?: string | null;
  stretchContext: StretchPointContext;
};

export type PositionSliderState = {
  index: number;
  max: number;
  fraction: number;
  currentStretch: Stretch | null;
  onChange: (value: number) => void;
};

export type PositionCompareMapConfig = {
  routePoints: TrackPoint[];
  highlightPoints: TrackPoint[];
  stretchOverlays?: StretchOverlay[];
  clickableRoute: TrackPoint[];
  markers: ExplorerMarker[];
};

export type PositionCompareMetrics = {
  activity: ReturnType<typeof metricsAtIndex>;
  reference: ReturnType<typeof metricsAtIndex>;
  referenceStretchContext: StretchPointContext | null;
  referencePositionColor?: string | null;
  showPositionLegend?: boolean;
  passRows: PositionPassRow[];
};

export type PositionComparePanelProps = {
  isActivity: boolean;
  zoneMaxHr?: number | null;
  activityDurationSec?: number | null;
  matchedPasses?: ReadonlyArray<SegmentPass>;
  slider: PositionSliderState;
  map: PositionCompareMapConfig;
  metrics: PositionCompareMetrics;
};

export type TimeSliderState = {
  elapsedSec: number;
  maxSec: number;
  step: number;
  currentStretch: Stretch | null;
  onChange: (value: number) => void;
};

export type TimeCompareMapConfig = {
  routePoints: TrackPoint[];
  stretchOverlays?: StretchOverlay[];
  markers: ExplorerMarker[];
};

export type TimeCompareMetrics = {
  reference: ReturnType<typeof metricsAtIndex>;
  referenceStretchContext: StretchPointContext | null;
  referencePositionColor?: string | null;
  showPositionLegend?: boolean;
  passRows: PositionPassRow[];
};

export type TimeComparePanelProps = {
  zoneMaxHr?: number | null;
  matchedPasses?: ReadonlyArray<SegmentPass>;
  slider: TimeSliderState;
  map: TimeCompareMapConfig;
  metrics: TimeCompareMetrics;
};

export type StretchTimeSliderState = {
  virtualSec: number;
  virtualMaxSec: number;
  step: number;
  localElapsedSec: number;
  localMaxSec: number;
  stretchIndex: number;
  stretchesCount: number;
  currentStretch: Stretch | null;
  canPrev: boolean;
  canNext: boolean;
  onVirtualChange: (value: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onLocalFractionChange: (fraction: number) => void;
};

export type StretchTimeMapConfig = {
  routePoints: TrackPoint[];
  stretchElevationPoints?: TrackPoint[];
  /** Points used to zoom the map to the current stretch. */
  fitPoints?: TrackPoint[];
  fitKey?: string;
  stretchOverlays?: StretchOverlay[];
  markers: ExplorerMarker[];
};

export type StretchTimePanelProps = {
  zoneMaxHr?: number | null;
  matchedPasses?: ReadonlyArray<SegmentPass>;
  slider: StretchTimeSliderState;
  map: StretchTimeMapConfig;
  metrics: TimeCompareMetrics;
};
