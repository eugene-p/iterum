import { describe, expect, it, vi } from "vitest";
import {
  ACTIVITY_IMPORTED_TOPIC,
  createActivityJobSystem,
  type ActivityJobHandlers,
  type ActivityJobSystem,
} from "@/jobs/createActivityJobSystem.js";

const waitQueueIdle = (queue: {
  on: (event: "worker:idle", cb: () => void) => () => void;
  isProcessing: () => boolean;
  isEmpty: () => boolean;
}): Promise<void> =>
  new Promise((resolve) => {
    const off = queue.on("worker:idle", () => {
      off();
      resolve();
    });
    if (queue.isEmpty() && !queue.isProcessing()) {
      off();
      resolve();
    }
  });

const waitSystemIdle = async (system: ActivityJobSystem): Promise<void> => {
  await Promise.all([
    waitQueueIdle(system.queues.geocode),
    waitQueueIdle(system.queues.match),
    waitQueueIdle(system.queues.preview),
  ]);
};

const baseHandlers = (
  overrides: Partial<ActivityJobHandlers> = {},
): ActivityJobHandlers => ({
  geocodeActivity: async () => undefined,
  matchActivity: async () => undefined,
  warmPreview: async () => undefined,
  ...overrides,
});

describe("createActivityJobSystem", () => {
  it("routes activity.imported to geocode, match, and preview workers", async () => {
    const geocoded: number[] = [];
    const matched: number[] = [];
    const previewed: number[] = [];

    const system = await createActivityJobSystem({
      handlers: baseHandlers({
        geocodeActivity: async (activityId) => {
          geocoded.push(activityId);
        },
        matchActivity: async (activityId) => {
          matched.push(activityId);
        },
        warmPreview: async (activityId) => {
          previewed.push(activityId);
        },
      }),
    });

    const delivered = system.publishActivityImported(42);
    expect(delivered).toBe(3);

    await waitSystemIdle(system);

    expect(geocoded).toEqual([42]);
    expect(matched).toEqual([42]);
    expect(previewed).toEqual([42]);

    system.stop();
  });

  it("keeps workers independent under concurrent publishes", async () => {
    const matchOrder: number[] = [];
    const previewOrder: number[] = [];
    const geocodeOrder: number[] = [];
    let matchGate: (() => void) | null = null;

    const system = await createActivityJobSystem({
      matchConcurrency: 1,
      previewConcurrency: 1,
      geocodeConcurrency: 1,
      handlers: baseHandlers({
        geocodeActivity: async (activityId) => {
          geocodeOrder.push(activityId);
        },
        matchActivity: async (activityId) => {
          if (activityId === 1) {
            await new Promise<void>((resolve) => {
              matchGate = resolve;
            });
          }
          matchOrder.push(activityId);
        },
        warmPreview: async (activityId) => {
          previewOrder.push(activityId);
        },
      }),
    });

    system.publishActivityImported(1);
    system.publishActivityImported(2);

    // Preview + geocode should finish both while match is still blocked on #1.
    await Promise.all([
      waitQueueIdle(system.queues.preview),
      waitQueueIdle(system.queues.geocode),
    ]);
    expect(previewOrder).toEqual([1, 2]);
    expect(geocodeOrder).toEqual([1, 2]);
    expect(matchOrder).toEqual([]);

    matchGate?.();
    await waitSystemIdle(system);
    expect(matchOrder).toEqual([1, 2]);

    system.stop();
  });

  it("reports match failures without blocking preview or geocode", async () => {
    const previewed: number[] = [];
    const geocoded: number[] = [];
    const matchFailures: Array<{ activityId: number; error: unknown }> = [];

    const system = await createActivityJobSystem({
      handlers: baseHandlers({
        geocodeActivity: async (activityId) => {
          geocoded.push(activityId);
        },
        matchActivity: async () => {
          throw new Error("match boom");
        },
        warmPreview: async (activityId) => {
          previewed.push(activityId);
        },
        onMatchFailed: (activityId, error) => {
          matchFailures.push({ activityId, error });
        },
      }),
    });

    system.publishActivityImported(7);
    await waitSystemIdle(system);

    expect(previewed).toEqual([7]);
    expect(geocoded).toEqual([7]);
    expect(matchFailures).toHaveLength(1);
    expect(matchFailures[0]?.activityId).toBe(7);
    expect(matchFailures[0]?.error).toBeInstanceOf(Error);

    system.stop();
  });

  it("reports geocode failures without blocking match", async () => {
    const matched: number[] = [];
    const geocodeFailures: Array<{ activityId: number; error: unknown }> = [];

    const system = await createActivityJobSystem({
      geocodeRetries: 0,
      handlers: baseHandlers({
        geocodeActivity: async () => {
          throw new Error("geocode boom");
        },
        matchActivity: async (activityId) => {
          matched.push(activityId);
        },
        onGeocodeFailed: (activityId, error) => {
          geocodeFailures.push({ activityId, error });
        },
      }),
    });

    system.publishActivityImported(5);
    await waitSystemIdle(system);

    expect(matched).toEqual([5]);
    expect(geocodeFailures).toHaveLength(1);
    expect(geocodeFailures[0]?.activityId).toBe(5);

    system.stop();
  });

  it("reports preview failures without blocking match", async () => {
    const matched: number[] = [];
    const previewFailures: Array<{ activityId: number; error: unknown }> = [];

    const system = await createActivityJobSystem({
      handlers: baseHandlers({
        matchActivity: async (activityId) => {
          matched.push(activityId);
        },
        warmPreview: async () => {
          throw new Error("preview boom");
        },
        onPreviewFailed: (activityId, error) => {
          previewFailures.push({ activityId, error });
        },
      }),
    });

    system.publishActivityImported(9);
    await waitSystemIdle(system);

    expect(matched).toEqual([9]);
    expect(previewFailures).toHaveLength(1);
    expect(previewFailures[0]?.activityId).toBe(9);

    system.stop();
  });

  it("parks unknown topics on the unrouted queue", async () => {
    const system = await createActivityJobSystem({
      handlers: baseHandlers({
        matchActivity: vi.fn(async () => undefined),
        warmPreview: vi.fn(async () => undefined),
      }),
    });

    const matched = system.router.publish("something.else", { activityId: 1 });
    expect(matched).toBe(0);
    expect(system.queues.unrouted.size()).toBe(1);
    expect(system.queues.unrouted.peek()?.topic).toBe("something.else");

    system.stop();
  });

  it("exposes the activity.imported topic constant", () => {
    expect(ACTIVITY_IMPORTED_TOPIC).toBe("activity.imported");
  });
});
