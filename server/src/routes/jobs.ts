import { Router } from "express";
import { getActivityJobQueueStatus } from "../jobs/activityJobs.js";

export const jobsRouter = Router();

jobsRouter.get("/status", (_req, res) => {
  res.json(getActivityJobQueueStatus());
});
