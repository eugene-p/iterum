/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { sampleActivityRoutePoints } from "../activityRouteSample.js";
import { getSegmentReferencePoints, loadSegment } from "../segmentRepository.js";
import { generateRoutePreviewImage } from "./generateRoutePreviewImage.js";
import { deletePreviewFile, readPreviewFile, writePreviewFile } from "./previewStorage.js";

const ACTIVITY_LINE_COLOR = "#2f6fed";
const SEGMENT_LINE_COLOR = "#22c55e";

export { deletePreviewFile } from "./previewStorage.js";

const logWarmFailure = (kind: string, id: number, error: unknown): void => {
  console.error(
    `Failed to warm ${kind} preview #${id}:`,
    error instanceof Error ? error.message : error,
  );
};

/** Eagerly generate and persist a preview. Errors are logged; callers are not interrupted. */
export async function warmActivityPreviewImage(activityId: number): Promise<void> {
  try {
    await ensureActivityPreviewImage(activityId);
  } catch (error) {
    logWarmFailure("activity", activityId, error);
  }
}

/** Eagerly generate and persist a preview. Errors are logged; callers are not interrupted. */
export async function warmSegmentPreviewImage(segmentId: number): Promise<void> {
  try {
    await ensureSegmentPreviewImage(segmentId);
  } catch (error) {
    logWarmFailure("segment", segmentId, error);
  }
}

export async function ensureActivityPreviewImage(activityId: number): Promise<Buffer | null> {
  const cached = await readPreviewFile("activities", activityId);
  if (cached) return cached;

  const preview = await sampleActivityRoutePoints(activityId);
  if (!preview || preview.points.length < 2) return null;

  const buffer = await generateRoutePreviewImage({
    kind: "activities",
    id: activityId,
    points: preview.points,
    lineColor: ACTIVITY_LINE_COLOR,
  });

  await writePreviewFile("activities", activityId, buffer);
  return buffer;
}

export async function ensureSegmentPreviewImage(segmentId: number): Promise<Buffer | null> {
  const cached = await readPreviewFile("segments", segmentId);
  if (cached) return cached;

  const segment = await loadSegment(segmentId);
  if (!segment) return null;

  const points = await getSegmentReferencePoints(segmentId);
  if (points.length < 2) return null;

  const buffer = await generateRoutePreviewImage({
    kind: "segments",
    id: segmentId,
    points: points.map((point) => ({ lat: point.lat, lon: point.lon })),
    lineColor: SEGMENT_LINE_COLOR,
  });

  await writePreviewFile("segments", segmentId, buffer);
  return buffer;
}