import {
  DEFAULT_STRETCH_THRESHOLDS,
  parseStretchThresholds,
  segmentizeStretches,
  type StretchResult,
  type StretchThresholds,
} from "./stretchSegmentation.js";
import { loadSegmentStretches, saveSegmentStretches } from "./stretchRepository.js";
import {
  loadFirstMatchedActivityId,
  stretchPointsFromActivityPass,
  stretchPointsFromReference,
} from "./stretchPoints.js";
import {
  normalizeManualStretches,
  type ManualStretchInput,
} from "./stretchManual.js";

const THRESHOLD_KEYS = Object.keys(DEFAULT_STRETCH_THRESHOLDS) as Array<keyof StretchThresholds>;

export const thresholdsEqual = (
  left: StretchThresholds | null | undefined,
  right: StretchThresholds,
): boolean => {
  if (!left) return false;
  return THRESHOLD_KEYS.every((key) => left[key] === right[key]);
};

export type StretchPreviewOptions = {
  thresholds?: StretchThresholds;
  stretchSourceActivityId?: number | null;
};

export const parseStretchPreviewOptions = (
  queryInput: Record<string, unknown>,
): StretchPreviewOptions => {
  const hasThresholdOverride = THRESHOLD_KEYS.some((key) => {
    const raw = queryInput[key];
    return raw != null && raw !== "";
  });
  const stretchSourceRaw = queryInput.stretch_source_activity_id;
  const stretchSourceActivityId =
    stretchSourceRaw != null && stretchSourceRaw !== ""
      ? Number(stretchSourceRaw)
      : undefined;

  return {
    thresholds: hasThresholdOverride ? parseStretchThresholds(queryInput) : undefined,
    stretchSourceActivityId:
      stretchSourceActivityId != null && Number.isFinite(stretchSourceActivityId)
        ? stretchSourceActivityId
        : undefined,
  };
};

export const effectiveSavedStretchSourceActivityId = (
  saved: NonNullable<Awaited<ReturnType<typeof loadSegmentStretches>>>,
  segmentSourceActivityId: number,
): number => saved.stretch_source_activity_id ?? segmentSourceActivityId;

export const effectiveSavedStretchThresholds = (
  saved: NonNullable<Awaited<ReturnType<typeof loadSegmentStretches>>>,
): StretchThresholds => saved.stretch_thresholds ?? DEFAULT_STRETCH_THRESHOLDS;

export const isStretchPreviewActive = (
  saved: Awaited<ReturnType<typeof loadSegmentStretches>>,
  preview: StretchPreviewOptions,
  segmentSourceActivityId: number,
): boolean => {
  if (!saved) return true;

  const savedSourceId = effectiveSavedStretchSourceActivityId(saved, segmentSourceActivityId);
  const savedThresholds = effectiveSavedStretchThresholds(saved);

  if (
    preview.stretchSourceActivityId != null &&
    preview.stretchSourceActivityId !== savedSourceId
  ) {
    return true;
  }
  if (preview.thresholds && !thresholdsEqual(savedThresholds, preview.thresholds)) {
    return true;
  }
  return false;
};

/* v8 ignore start -- @preserve */
// Integration orchestration (DB-backed point/stretch loaders). Cover via integration tests.
export const computeStretchesForSegment = async (
  segmentId: number,
  sourceActivityId: number,
  thresholds: StretchThresholds = DEFAULT_STRETCH_THRESHOLDS,
  useActivityPass = false,
): Promise<StretchResult> => {
  const points = useActivityPass
    ? await stretchPointsFromActivityPass(segmentId, sourceActivityId)
    : await stretchPointsFromReference(segmentId);
  return segmentizeStretches(points, thresholds);
};

export const persistDefaultStretches = async (
  segmentId: number,
  sourceActivityId: number,
  thresholds: StretchThresholds = DEFAULT_STRETCH_THRESHOLDS,
) => {
  const result = await computeStretchesForSegment(
    segmentId,
    sourceActivityId,
    thresholds,
    false,
  );
  await saveSegmentStretches(segmentId, sourceActivityId, result);
  return result;
};

export const resolveStretchSourceActivityId = async (
  segmentId: number,
  sourceActivityId: number,
  requestedActivityId?: number | null,
): Promise<number> => {
  if (requestedActivityId != null) return requestedActivityId;
  const firstMatched = await loadFirstMatchedActivityId(segmentId);
  return firstMatched ?? sourceActivityId;
};

export const saveStretchesForSegment = async (
  segmentId: number,
  segmentSourceActivityId: number,
  thresholds: StretchThresholds,
  stretchSourceActivityId?: number | null,
) => {
  const resolvedSource = await resolveStretchSourceActivityId(
    segmentId,
    segmentSourceActivityId,
    stretchSourceActivityId,
  );
  const useActivityPass = resolvedSource !== segmentSourceActivityId;
  const result = await computeStretchesForSegment(
    segmentId,
    resolvedSource,
    thresholds,
    useActivityPass,
  );
  await saveSegmentStretches(segmentId, resolvedSource, result);
  return { result, stretchSourceActivityId: resolvedSource };
};

export const saveManualStretchesForSegment = async (
  segmentId: number,
  segmentSourceActivityId: number,
  thresholds: StretchThresholds,
  stretches: ManualStretchInput[],
  stretchSourceActivityId?: number | null,
) => {
  const resolvedSource = await resolveStretchSourceActivityId(
    segmentId,
    segmentSourceActivityId,
    stretchSourceActivityId,
  );
  const result = normalizeManualStretches(stretches, thresholds);
  await saveSegmentStretches(segmentId, resolvedSource, result);
  return { result, stretchSourceActivityId: resolvedSource };
};
/* v8 ignore stop -- @preserve */