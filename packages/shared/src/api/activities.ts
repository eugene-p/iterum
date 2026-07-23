import { z } from "zod";

export const listActivitiesQuerySchema = z.object({
  profile_id: z
    .union([z.literal("all"), z.coerce.number().int().positive()])
    .optional(),
});
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;

export const updateActivityBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    profile_id: z.coerce.number().int().positive().optional(),
  })
  .refine((body) => body.name !== undefined || body.profile_id !== undefined, {
    message: "At least one of name or profile_id is required",
  });
export type UpdateActivityBody = z.infer<typeof updateActivityBodySchema>;

export const uploadActivityBodySchema = z.object({
  profile_id: z.coerce.number().int().positive().optional(),
});
export type UploadActivityBody = z.infer<typeof uploadActivityBodySchema>;