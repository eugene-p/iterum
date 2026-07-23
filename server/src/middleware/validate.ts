/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export type RequestSource = "body" | "query" | "params";

declare module "express-serve-static-core" {
  interface Request {
    validated: Partial<Record<RequestSource, unknown>>;
  }
}

export const validate =
  <T>(schema: ZodType<T>, source: RequestSource = "body"): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.validated ??= {};
    req.validated[source] = result.data;
    next();
  };

export const validated = <T>(req: Request, source: RequestSource): T =>
  req.validated[source] as T;