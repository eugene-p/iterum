/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import {
  createSegmentBodySchema,
  type CreateSegmentBody,
  type IdParams,
  idParamSchema,
  parseStretchThresholds,
  reverseSegmentBodySchema,
  type ReverseSegmentBody,
  saveSegmentStretchesBodySchema,
  type SaveSegmentStretchesBody,
  segmentCompareQuerySchema,
  type SegmentCompareQuery,
  updateSegmentBodySchema,
  type UpdateSegmentBody,
} from "@fit-analysis/shared";
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { NotFoundError } from "../middleware/errors.js";
import { validated, validate } from "../middleware/validate.js";
import {
  createReversedSegment,
  createSegmentFromActivity,
  deleteSegment,
  getSegmentById,
  getSegmentPasses,
  getSegmentReferencePoints,
  listSegments,
  rescanSegment,
  saveSegmentStretchesFromPreview,
  updateSegment,
} from "../services/segments.js";
import { ensureSegmentPreviewImage } from "../services/routePreview/routePreviewService.js";
import { sendRoutePreviewImage } from "./sendRoutePreviewImage.js";

export const segmentsRouter = Router();

segmentsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const segments = await listSegments();
    res.json(segments);
  }),
);

segmentsRouter.post(
  "/",
  validate(createSegmentBodySchema, "body"),
  asyncHandler(async (req, res) => {
    const body = validated<CreateSegmentBody>(req, "body");
    const segment = await createSegmentFromActivity(body);
    res.status(201).json(segment);
  }),
);

segmentsRouter.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateSegmentBodySchema, "body"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const body = validated<UpdateSegmentBody>(req, "body");
    const segment = await updateSegment(id, body);
    res.json(segment);
  }),
);

segmentsRouter.post(
  "/:id/reverse",
  validate(idParamSchema, "params"),
  validate(reverseSegmentBodySchema, "body"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const { name } = validated<ReverseSegmentBody>(req, "body");
    const segment = await createReversedSegment(id, name ?? "");
    res.status(201).json(segment);
  }),
);

segmentsRouter.get(
  "/:id/preview.jpg",
  validate(idParamSchema, "params"),
  sendRoutePreviewImage(ensureSegmentPreviewImage),
);

segmentsRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const segment = await getSegmentById(id);
    if (!segment) {
      throw new NotFoundError("Segment not found");
    }
    res.json(segment);
  }),
);

segmentsRouter.get(
  "/:id/reference",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const points = await getSegmentReferencePoints(id);
    res.json(points);
  }),
);

segmentsRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const deleted = await deleteSegment(id);
    if (!deleted) {
      throw new NotFoundError("Segment not found");
    }
    res.json({ ok: true });
  }),
);

segmentsRouter.post(
  "/:id/rescan",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const result = await rescanSegment(id);
    res.json(result);
  }),
);

segmentsRouter.get(
  "/:id/compare",
  validate(idParamSchema, "params"),
  validate(segmentCompareQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const preview = validated<SegmentCompareQuery>(req, "query");
    const data = await getSegmentPasses(id, {
      thresholds: preview.thresholds,
      stretchSourceActivityId: preview.stretchSourceActivityId,
    });
    if (!data) {
      throw new NotFoundError("Segment not found");
    }
    res.json(data);
  }),
);

segmentsRouter.put(
  "/:id/stretches",
  validate(idParamSchema, "params"),
  validate(saveSegmentStretchesBodySchema, "body"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const body = validated<SaveSegmentStretchesBody>(req, "body");
    const parsedThresholds = parseStretchThresholds(body.thresholds);
    const saved = await saveSegmentStretchesFromPreview(
      id,
      parsedThresholds,
      body.stretch_source_activity_id ?? undefined,
    );
    const data = await getSegmentPasses(id);
    if (!data) {
      throw new NotFoundError("Segment not found");
    }
    res.json({ ...data, saved_stretch_count: saved.result.stretches.length });
  }),
);
