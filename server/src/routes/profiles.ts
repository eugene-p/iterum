/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import {
  createProfileBodySchema,
  type CreateProfileBody,
  type IdParams,
  idParamSchema,
  parseStretchThresholds,
  updateProfileBodySchema,
  type UpdateProfileBody,
} from "@fit-analysis/shared";
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { NotFoundError } from "../middleware/errors.js";
import { validated, validate } from "../middleware/validate.js";
import {
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  updateProfile,
} from "../services/profiles.js";

export const profilesRouter = Router();

profilesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const profiles = await listProfiles();
    res.json(profiles);
  }),
);

profilesRouter.post(
  "/",
  validate(createProfileBodySchema, "body"),
  asyncHandler(async (req, res) => {
    const body = validated<CreateProfileBody>(req, "body");
    const profile = await createProfile(body.name, {
      yearOfBirth: body.year_of_birth,
      defaultStretchThresholds:
        body.default_stretch_thresholds != null
          ? parseStretchThresholds(body.default_stretch_thresholds)
          : undefined,
    });
    res.status(201).json(profile);
  }),
);

profilesRouter.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const profile = await getProfile(id);
    if (!profile) {
      throw new NotFoundError("Profile not found");
    }
    res.json(profile);
  }),
);

profilesRouter.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateProfileBodySchema, "body"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    const body = validated<UpdateProfileBody>(req, "body");
    const profile = await updateProfile(id, {
      name: body.name,
      year_of_birth: body.year_of_birth,
      default_stretch_thresholds:
        body.default_stretch_thresholds != null
          ? parseStretchThresholds(body.default_stretch_thresholds)
          : undefined,
    });
    if (!profile) {
      throw new NotFoundError("Profile not found");
    }
    res.json(profile);
  }),
);

profilesRouter.delete(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    const { id } = validated<IdParams>(req, "params");
    await deleteProfile(id);
    res.json({ ok: true });
  }),
);
