import { describe, expect, it } from "vitest";
import {
  activityJobDlqFailureCount,
  isActivityJobWorkDrained,
  type ActivityJobQueueStatus,
} from "./activityJobStatus";

const status = (
  overrides: Partial<{
    work: Partial<ActivityJobQueueStatus["work"]>;
    dlq: Partial<ActivityJobQueueStatus["dlq"]>;
  }> = {},
): ActivityJobQueueStatus => ({
  work: {
    geocode: { pending: 0, active: 0 },
    match: { pending: 0, active: 0 },
    preview: { pending: 0, active: 0 },
    ...overrides.work,
  },
  dlq: {
    geocode: 0,
    match: 0,
    preview: 0,
    ...overrides.dlq,
  },
});

describe("activityJobStatus helpers", () => {
  it("treats all-zero work as drained", () => {
    expect(isActivityJobWorkDrained(status())).toBe(true);
  });

  it("is not drained while any work is pending or active", () => {
    expect(
      isActivityJobWorkDrained(status({ work: { match: { pending: 1, active: 0 } } })),
    ).toBe(false);
    expect(
      isActivityJobWorkDrained(status({ work: { preview: { pending: 0, active: 1 } } })),
    ).toBe(false);
  });

  it("sums dlq failures and treats empty dlq as zero", () => {
    expect(activityJobDlqFailureCount(status())).toBe(0);
    expect(
      activityJobDlqFailureCount(
        status({ dlq: { geocode: 1, match: 2, preview: 0 } }),
      ),
    ).toBe(3);
  });
});
