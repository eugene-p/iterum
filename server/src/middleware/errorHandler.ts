/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { GeoPointParseError } from "../db/geoPoint.js";
import { AppError } from "./errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join("; ") || "Invalid request";
    res.status(400).json({ error: message, details: err.flatten() });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof GeoPointParseError) {
    res.status(500).json({ error: "Invalid stored geometry" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
