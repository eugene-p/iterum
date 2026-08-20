import { afterEach, describe, expect, it, vi } from "vitest";
import {
  scheduleActivityImported,
  setActivityJobSystemForTests,
  startActivityJobs,
  stopActivityJobs,
} from "@/jobs/activityJobs.js";
import type { ActivityJobSystem } from "@/jobs/createActivityJobSystem.js";

vi.mock("@/services/segmentMatching.js", () => ({ logMatchFailure: vi.fn() }));

vi.mock("@/services/segmentBaselineAggregator.js", () => ({
  matchActivityAndRefreshBaselines: vi.fn(async () => undefined),
}));

vi.mock("@/services/routePreview/routePreviewService.js", () => ({
  warmActivityPreviewImage: vi.fn(async () => undefined),
}));

vi.mock("@/services/geocodeActivity.js", () => ({
  geocodeActivity: vi.fn(async () => undefined),
}));

import { geocodeActivity } from "@/services/geocodeActivity.js";
import { matchActivityAndRefreshBaselines } from "@/services/segmentBaselineAggregator.js";
import { warmActivityPreviewImage } from "@/services/routePreview/routePreviewService.js";

afterEach(async () => {
  await stopActivityJobs();
  setActivityJobSystemForTests(null);
  vi.clearAllMocks();
});

describe("activityJobs", () => {
  it("publishes through the started system when available", async () => {
    const publishActivityImported = vi.fn(() => 3);
    const flushAll = vi.fn(async () => undefined);
    const stop = vi.fn();

    setActivityJobSystemForTests({
      publishActivityImported,
      flushAll,
      stop,
      queues: {} as ActivityJobSystem["queues"],
    });

    scheduleActivityImported(11);

    expect(publishActivityImported).toHaveBeenCalledWith(11);
    expect(geocodeActivity).not.toHaveBeenCalled();
    expect(matchActivityAndRefreshBaselines).not.toHaveBeenCalled();
    expect(warmActivityPreviewImage).not.toHaveBeenCalled();
  });

  it("falls back to direct geocode + match + preview when system is not started", () => {
    scheduleActivityImported(22);

    expect(geocodeActivity).toHaveBeenCalledWith(22);
    expect(matchActivityAndRefreshBaselines).toHaveBeenCalledWith(22);
    expect(warmActivityPreviewImage).toHaveBeenCalledWith(22);
  });

  it("start is idempotent and stop clears the system", async () => {
    const first = await startActivityJobs({ persistence: null });
    const second = await startActivityJobs({ persistence: null });
    expect(second).toBe(first);

    await stopActivityJobs();
    scheduleActivityImported(33);
    expect(geocodeActivity).toHaveBeenCalledWith(33);
    expect(matchActivityAndRefreshBaselines).toHaveBeenCalledWith(33);
  });
});
