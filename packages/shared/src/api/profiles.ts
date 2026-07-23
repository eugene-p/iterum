import { z } from "zod";
import { stretchThresholdsSchema } from "../stretch.js";

const currentYear = () => new Date().getFullYear();

export const yearOfBirthSchema = z
  .union([
    z.null(),
    z.literal(""),
    z.coerce.number().int().min(1900).max(currentYear()),
  ])
  .transform((value) => (value === "" ? null : value));

export const createProfileBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  year_of_birth: yearOfBirthSchema.optional(),
  default_stretch_thresholds: stretchThresholdsSchema.partial().optional(),
});
export type CreateProfileBody = z.infer<typeof createProfileBodySchema>;

export const updateProfileBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    year_of_birth: yearOfBirthSchema.optional(),
    default_stretch_thresholds: stretchThresholdsSchema.partial().optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.year_of_birth !== undefined ||
      body.default_stretch_thresholds !== undefined,
    { message: "At least one field is required" },
  );
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;