/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { pool } from "./db/pool.js";
import { startActivityJobs, stopActivityJobs } from "./jobs/activityJobs.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { activitiesRouter } from "./routes/activities.js";
import { jobsRouter } from "./routes/jobs.js";
import { profilesRouter } from "./routes/profiles.js";
import { segmentsRouter } from "./routes/segments.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 8181);

const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT ?? "1mb" }));

app.get(
  "/api/health",
  async (_req, res, next) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  },
);

app.use("/api/profiles", profilesRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/segments", segmentsRouter);
app.use("/api/jobs", jobsRouter);

const frontendDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use(errorHandler);

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}; shutting down…`);
  try {
    await stopActivityJobs();
  } catch (error) {
    console.error("Failed to stop activity jobs:", error);
  }
  try {
    await pool.end();
  } catch (error) {
    console.error("Failed to close database pool:", error);
  }
  process.exit(0);
};

const main = async () => {
  await startActivityJobs();

  app.listen(port, () => {
    console.log(`Iterum API running at http://127.0.0.1:${port}`);
  });

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
};

void main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
