/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import {
  idParamSchema,
  listActivitiesQuerySchema,
  type ListActivitiesQuery,
  type IdParams,
  type UpdateActivityBody,
  type UploadActivityBody,
  updateActivityBodySchema,
  uploadActivityBodySchema,
} from "@eugene-p/iterum-shared";
import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../middleware/errors.js";
import { validated, validate } from "../middleware/validate.js";
import { sampleActivityRoutePoints } from "../services/activityRouteSample.js";
import {
  deleteActivity,
  getActivityDeleteInfo,
  getActivityMatchedSegments,
  getActivityPoints,
  getActivitySummary,
  importFileContent,
  listActivities,
  updateActivity,
} from "../services/activities.js";
import { ensureActivityPreviewImage } from "../services/routePreview/routePreviewService.js";
import { sendRoutePreviewImage } from "./sendRoutePreviewImage.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
export const activitiesRouter = Router();

activitiesRouter.get(
  "/",
  validate(listActivitiesQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    const { profile_id: profileId } = validated<ListActivitiesQuery>(req, "query");
    const activities = await listActivities(profileId);
    res.json(activities);
  }),
);

activitiesRouter.post(
  "/upload",
  upload.single("file"),
  validate(uploadActivityBodySchema, "body"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    const { profile_id: profileId } = validated<UploadActivityBody>(req, "body");
    const content = req.file.buffer.toString("utf8");
    const { id } = await importFileContent(content, req.file.originalname, profileId);
    const activity = await getActivitySummary(id);
    res.status(201).json(activity);
  }),
);

activitiesRouter.get(
  "/:id/delete-info",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const info = await getActivityDeleteInfo(id);
    res.json(info);
  }),
);

activitiesRouter.get(
  "/:id/matched-segments",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const segments = await getActivityMatchedSegments(id);
    if (!segments) {
      throw new NotFoundError("Activity not found");
    }
    res.json(segments);
  }),
);

activitiesRouter.get(
  "/:id/route-sample",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const sample = await sampleActivityRoutePoints(id);
    if (!sample) {
      throw new NotFoundError("Activity not found");
    }
    res.json(sample);
  }),
);

activitiesRouter.get(
  "/:id/preview.jpg",
  validate(idParamSchema, "params"),
  sendRoutePreviewImage(ensureActivityPreviewImage),
);

activitiesRouter.get(
  "/:id/points",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const payload = await getActivityPoints(id);
    if (!payload) {
      throw new NotFoundError("Activity not found");
    }
    res.json(payload);
  }),
);

activitiesRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const activity = await getActivitySummary(id);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    res.json(activity);
  }),
);

activitiesRouter.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateActivityBodySchema, "body"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const body = validated<UpdateActivityBody>(req, "body");
    const activity = await updateActivity(id, body);
    if (!activity) {
      throw new NotFoundError("Activity not found");
    }
    res.json(activity);
  }),
);

activitiesRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const deleted = await deleteActivity(id);
    if (!deleted) {
      throw new NotFoundError("Activity not found");
    }
    res.json({ ok: true });
  }),
);
