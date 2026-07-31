import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { buildQueue, type RowRecord } from "@qkitt/queue";
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

  it("round-trips attempt and dlqHandoffAttempt across reopen", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "qkitt-queue-store-"));
    const filename = path.join(directory, "jobs.sqlite");
    const tableName = "queue_rows";

    const firstStore = createNodeSqliteRowStore<{ id: number }>({ filename, tableName });
    const record: RowRecord<{ id: number }> = {
      id: 1,
      item: { id: 42 },
      availableAt: 0,
      leaseGeneration: null,
      leaseExpiresAt: null,
      attempt: 3,
      dlqHandoffAttempt: 2,
    };
    firstStore.put(record);
    firstStore.close();

    const secondStore = createNodeSqliteRowStore<{ id: number }>({ filename, tableName });
    const loaded = secondStore.loadAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      id: 1,
      item: { id: 42 },
      attempt: 3,
      dlqHandoffAttempt: 2,
    });
    secondStore.close();
  });

  it("adds delivery columns when opening a legacy table", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "qkitt-queue-store-"));
    const filename = path.join(directory, "jobs.sqlite");
    const tableName = "legacy_rows";

    const db = new DatabaseSync(filename);
    db.exec(`
      CREATE TABLE ${tableName} (
        id INTEGER PRIMARY KEY CHECK (id >= 1),
        item_json TEXT NOT NULL,
        available_at INTEGER NOT NULL,
        lease_generation INTEGER,
        lease_expires_at INTEGER
      )
    `);
    db.prepare(
      `INSERT INTO ${tableName} (id, item_json, available_at, lease_generation, lease_expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(1, JSON.stringify({ id: 7 }), 0, null, null);
    db.close();

    const store = createNodeSqliteRowStore<{ id: number }>({ filename, tableName });
    const loaded = store.loadAll();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.item).toEqual({ id: 7 });
    expect(loaded[0]?.attempt).toBeUndefined();
    expect(loaded[0]?.dlqHandoffAttempt).toBeUndefined();

    store.put({
      id: 1,
      item: { id: 7 },
      availableAt: 0,
      leaseGeneration: null,
      leaseExpiresAt: null,
      attempt: 2,
      dlqHandoffAttempt: 1,
    });
    const after = store.loadAll();
    expect(after[0]).toMatchObject({ attempt: 2, dlqHandoffAttempt: 1 });
    store.close();
  });
});
