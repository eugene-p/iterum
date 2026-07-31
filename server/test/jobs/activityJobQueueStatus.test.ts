import { afterEach, describe, expect, it } from "vitest";
import {
  getActivityJobQueueStatus,
  setActivityJobSystemForTests,
} from "@/jobs/activityJobs.js";
import type { ActivityJobQueueStatus } from "@/jobs/createActivityJobSystem.js";

describe("getActivityJobQueueStatus", () => {
  afterEach(() => {
    setActivityJobSystemForTests(null);
  });

  it("returns zeros when the job system is not started", () => {
    expect(getActivityJobQueueStatus()).toEqual({
      work: {
        geocode: { pending: 0, active: 0 },
        match: { pending: 0, active: 0 },
        preview: { pending: 0, active: 0 },
      },
      dlq: { geocode: 0, match: 0, preview: 0 },
    });
  });

  it("returns status from the active job system", () => {
    const status: ActivityJobQueueStatus = {
      work: {
        geocode: { pending: 1, active: 0 },
        match: { pending: 0, active: 1 },
        preview: { pending: 0, active: 0 },
      },
      dlq: { geocode: 0, match: 2, preview: 0 },
    };
    setActivityJobSystemForTests({
      publishActivityImported: async () => 0,
      flushAll: async () => undefined,
      stop: async () => undefined,
      jobQueueStatus: () => status,
      queues: {} as never,
    });
    expect(getActivityJobQueueStatus()).toEqual(status);
  });
});
