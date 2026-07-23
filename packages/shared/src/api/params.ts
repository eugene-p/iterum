import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type IdParams = z.infer<typeof idParamSchema>;