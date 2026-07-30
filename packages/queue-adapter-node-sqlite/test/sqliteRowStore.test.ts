import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { buildQueue } from "@qkitt/queue";
import { createNodeSqliteRowStore } from "../src/index.js";

describe("createNodeSqliteRowStore", () => {
  let directory: string | undefined;

  afterEach(async () => {
    if (directory) await rm(directory, { recursive: true, force: true });
    directory = undefined;
  });

  it("restores rows, including delayed rows, after reopening the database", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "qkitt-queue-store-"));
    const filename = path.join(directory, "jobs.sqlite");

    const firstStore = createNodeSqliteRowStore<{ id: number }>({ filename });
    const first = buildQueue<{ id: number }>({ store: firstStore });
    await first.enqueue({ id: 1 });
    await first.enqueue({ id: 2 }, { delayMs: 60_000 });
    await first.flush();
    firstStore.close();

    const secondStore = createNodeSqliteRowStore<{ id: number }>({ filename });
    const restored = buildQueue<{ id: number }>({ store: secondStore });
    await restored.hydrate();

    expect(restored.toArray()).toEqual([{ id: 1 }, { id: 2 }]);
    expect(restored.stats()).toMatchObject({ available: 1, delayed: 1, leased: 0 });
    secondStore.close();
  });
});
