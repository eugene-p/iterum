/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import type { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { NotFoundError } from "../middleware/errors.js";

export const sendRoutePreviewImage =
  (resolve: (id: number) => Promise<Buffer | null>) =>
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = (req.validated?.params ?? req.params) as { id: number };
    const buffer = await resolve(Number(id));
    if (!buffer) {
      throw new NotFoundError("Preview not found");
    }
    res.set("Content-Type", "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  });