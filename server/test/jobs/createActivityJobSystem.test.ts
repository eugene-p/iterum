import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryRowStore, whenIdle } from "@qkitt/queue";
import {
  ACTIVITY_IMPORTED_TOPIC,
  createActivityJobSystem,
  type ActivityJobHandlers,
  type ActivityJobSystem,
} from "@/jobs/createActivityJobSystem.js";

const systems: ActivityJobSystem[] = [];

const waitSystemIdle = async (system: ActivityJobSystem): Promise<void> => {
  await Promise.all([
    whenIdle(system.queues.geocode),
    whenIdle(system.queues.match),
    whenIdle(system.queues.preview),
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

const startSystem = async (
  options: Parameters<typeof createActivityJobSystem>[0],
): Promise<ActivityJobSystem> => {
  const system = await createActivityJobSystem(options);
  systems.push(system);
  return system;
};

afterEach(async () => {
  while (systems.length > 0) {
    const system = systems.pop();
    if (system) await system.stop();
  }
});

describe("createActivityJobSystem", () => {
  it("routes activity.imported to geocode, match, and preview workers", async () => {
    const geocoded: number[] = [];
    const matched: number[] = [];
    const previewed: number[] = [];

    const system = await startSystem({
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

    const delivered = await system.publishActivityImported(42);
    expect(delivered).toBe(3);

    await waitSystemIdle(system);

    expect(geocoded).toEqual([42]);
    expect(matched).toEqual([42]);
    expect(previewed).toEqual([42]);
  });

  it("keeps workers independent under concurrent publishes", async () => {
    const matchOrder: number[] = [];
    const previewOrder: number[] = [];
    const geocodeOrder: number[] = [];
    let matchGate: (() => void) | null = null;

    const system = await startSystem({
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

    await system.publishActivityImported(1);
    await system.publishActivityImported(2);

    await Promise.all([
      whenIdle(system.queues.preview),
      whenIdle(system.queues.geocode),
    ]);
    expect(previewOrder).toEqual([1, 2]);
    expect(geocodeOrder).toEqual([1, 2]);
    expect(matchOrder).toEqual([]);

    matchGate?.();
    await waitSystemIdle(system);
    expect(matchOrder).toEqual([1, 2]);
  });

  it("reports match failures without blocking preview or geocode", async () => {
    const previewed: number[] = [];
    const geocoded: number[] = [];
    const matchFailures: Array<{ activityId: number; error: unknown }> = [];

    const system = await startSystem({
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

    await system.publishActivityImported(7);
    await waitSystemIdle(system);

    expect(previewed).toEqual([7]);
    expect(geocoded).toEqual([7]);
    expect(matchFailures).toHaveLength(1);
    expect(matchFailures[0]?.activityId).toBe(7);
    expect(matchFailures[0]?.error).toBeInstanceOf(Error);
    expect(system.jobQueueStatus().dlq.match).toBe(1);
  });

  it("reports geocode failures without blocking match", async () => {
    const matched: number[] = [];
    const geocodeFailures: Array<{ activityId: number; error: unknown }> = [];

    const system = await startSystem({
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

    await system.publishActivityImported(5);
    await waitSystemIdle(system);

    expect(matched).toEqual([5]);
    expect(geocodeFailures).toHaveLength(1);
    expect(geocodeFailures[0]?.activityId).toBe(5);
    expect(system.jobQueueStatus().dlq.geocode).toBe(1);
  });

  it("retries geocode with durable attempt budget before succeeding", async () => {
    let attempts = 0;
    const system = await startSystem({
      geocodeRetries: 2,
      persistence: {
        createStore: () => createMemoryRowStore(),
      },
      handlers: baseHandlers({
        geocodeActivity: async () => {
          attempts += 1;
          if (attempts < 3) throw new Error("transient geocode");
        },
      }),
    });

    await system.publishActivityImported(11);
    await waitSystemIdle(system);

    expect(attempts).toBe(3);
    expect(system.jobQueueStatus().dlq.geocode).toBe(0);
  });

  it("fails a worker when the cooperative timeout elapses", async () => {
    const previewFailures: Array<{ activityId: number; error: unknown }> = [];
    const matched: number[] = [];

    const system = await startSystem({
      previewTimeoutMs: 20,
      handlers: baseHandlers({
        matchActivity: async (activityId) => {
          matched.push(activityId);
        },
        warmPreview: async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 200);
          });
        },
        onPreviewFailed: (activityId, error) => {
          previewFailures.push({ activityId, error });
        },
      }),
    });

    await system.publishActivityImported(9);
    await waitSystemIdle(system);

    expect(matched).toEqual([9]);
    expect(previewFailures).toHaveLength(1);
    expect(previewFailures[0]?.activityId).toBe(9);
    expect(system.jobQueueStatus().dlq.preview).toBe(1);
  });

  it("reports preview failures without blocking match", async () => {
    const matched: number[] = [];
    const previewFailures: Array<{ activityId: number; error: unknown }> = [];

    const system = await startSystem({
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

    await system.publishActivityImported(9);
    await waitSystemIdle(system);

    expect(matched).toEqual([9]);
    expect(previewFailures).toHaveLength(1);
    expect(previewFailures[0]?.activityId).toBe(9);
  });

  it("exposes empty job queue status when idle", async () => {
    const system = await startSystem({ handlers: baseHandlers() });
    expect(system.jobQueueStatus()).toEqual({
      work: {
        geocode: { pending: 0, active: 0 },
        match: { pending: 0, active: 0 },
        preview: { pending: 0, active: 0 },
      },
      dlq: { geocode: 0, match: 0, preview: 0 },
    });
  });

  it("reports non-drained work status while a handler is blocked", async () => {
    let release: (() => void) | null = null;
    const system = await startSystem({
      matchConcurrency: 1,
      handlers: baseHandlers({
        matchActivity: async () => {
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        },
      }),
    });

    await system.publishActivityImported(3);

    await vi.waitFor(() => {
      const match = system.jobQueueStatus().work.match;
      expect(match.pending + match.active).toBeGreaterThan(0);
    });

    release?.();
    await waitSystemIdle(system);
    expect(system.jobQueueStatus().work.match).toEqual({ pending: 0, active: 0 });
  });

  it("exposes the activity.imported topic constant", () => {
    expect(ACTIVITY_IMPORTED_TOPIC).toBe("activity.imported");
  });
});
