import type { StretchPassMetrics } from "../../stretchUtils";
import type {
  Segment,
  SegmentBaselines,
  SegmentCompare,
  SegmentPass,
  Stretch,
  StretchState,
  StretchThresholds,
  TrackPoint,
} from "../../types";

export type PassStretchMetrics = Omit<StretchPassMetrics, "pass">;

export type MapRoute = { id: number; points: TrackPoint[]; selected: boolean };

export type StretchOverlay = {
  id: number | string;
  points: TrackPoint[];
  color: string;
};

export type SegmentDetailMapState = {
  routes: MapRoute[];
  segmentHighlightPoints: TrackPoint[];
  stretchOverlays: StretchOverlay[];
};

export type SegmentDetailStretchState = {
  selectedStretch: Stretch | null;
  selectedPassStretchMetrics: PassStretchMetrics | null;
  thresholds: StretchThresholds | undefined;
  defaultThresholds?: StretchThresholds;
  stretchSourceActivityId: number | null;
  stretchCanSave: boolean;
  stretchState: StretchState;
  selectedStretchIndex: number | null;
  stretchPassMetrics: StretchPassMetrics[];
  fullPassMetrics: StretchPassMetrics[];
  stretchSourcePassId: number | null;
  loading: boolean;
};

export type SegmentHeaderActions = {
  loading: boolean;
  editError: string | null;
  onSegmentSaved: (segmentId: number) => void;
  onComparePasses: () => void;
  onEditStretches: () => void;
  onReverse: (segmentId: number, name: string) => Promise<boolean>;
  onRescan: () => void;
  onDelete: () => void;
  stretchSourcePassId?: number | null;
  stretchSourceActivityId?: number | null;
  onSetStretchSource?: (activityId: number) => void;
};

export type SegmentDetailActions = {
  onSelectStretch: (stretch: Stretch) => void;
  onClearStretchSelection: () => void;
  onSetPassIncluded: (pass: SegmentPass, included: boolean) => void;
  onApplyPassSelection: (ids: ReadonlyArray<number>) => void;
  onExcludeIncludedPass: (pass: SegmentPass) => void;
  onPreviewStretchThresholds: (thresholds: StretchThresholds) => void;
  onSetStretchSourceActivity: (activityId: number) => void;
  onResetStretchPreview: () => void;
  onSaveStretches: () => void;
};

export type SegmentDetailViewProps = {
  segment: Segment;
  comparison: SegmentCompare | null;
  selectedPass: SegmentPass | null;
  includedPassIdSet: ReadonlySet<number>;
  map: SegmentDetailMapState;
  stretch: SegmentDetailStretchState;
  headerActions: SegmentHeaderActions;
  actions: SegmentDetailActions;
  baselines?: SegmentBaselines | null;
  baselineAggregationType?: string;
  onBaselineAggregationTypeChange?: (type: string) => void;
  focalActivityId?: number | null;
  focalPassNumber?: number | null;
  onFocusPass?: (pass: SegmentPass) => void;
};
