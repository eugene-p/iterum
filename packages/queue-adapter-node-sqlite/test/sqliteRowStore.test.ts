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

  it("round-trips undefined payloads across reopen", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "qkitt-queue-store-"));
    const filename = path.join(directory, "jobs.sqlite");

    const firstStore = createNodeSqliteRowStore<undefined>({ filename });
    const first = buildQueue<undefined>({ store: firstStore });
    await first.enqueue(undefined);
    firstStore.close();

    const secondStore = createNodeSqliteRowStore<undefined>({ filename });
    const restored = buildQueue<undefined>({ store: secondStore });
    await restored.hydrate();

    expect(restored.toArray()).toEqual([undefined]);
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

  it("preserves 0.15 durable lease and delivery state across recovery", async () => {
    directory = await mkdtemp(path.join(tmpdir(), "qkitt-queue-store-"));
    const filename = path.join(directory, "jobs.sqlite");

    const firstStore = createNodeSqliteRowStore<{ id: number }>({ filename });
    const first = buildQueue<{ id: number }>({ store: firstStore });
    await first.enqueue({ id: 1 });
    const lease = await first.claim();

    expect(lease).toMatchObject({ id: 1, item: { id: 1 }, attempt: 1 });
    expect(firstStore.loadAll()[0]).toMatchObject({
      id: 1,
      leaseGeneration: lease?.generation,
      leaseExpiresAt: null,
    });

    await first.reschedule(lease!, {
      item: { id: 2 },
      attempt: 3,
      dlqHandoffAttempt: 2,
    });
    expect(firstStore.loadAll()[0]).toMatchObject({
      item: { id: 2 },
      availableAt: 0,
      leaseGeneration: null,
      leaseExpiresAt: null,
      attempt: 3,
      dlqHandoffAttempt: 2,
    });
    firstStore.close();

    const secondStore = createNodeSqliteRowStore<{ id: number }>({ filename });
    const restored = buildQueue<{ id: number }>({ store: secondStore });
    await restored.hydrate();

    expect(restored.toArray()).toEqual([{ id: 2 }]);
    expect(restored.stats()).toEqual({ available: 1, delayed: 0, leased: 0 });
    secondStore.close();
  });

  it("supports atomic batch mutations and rolls back failed replacements", () => {
    const store = createNodeSqliteRowStore<{ id: number }>({ filename: ":memory:" });
    const first: RowRecord<{ id: number }> = {
      id: 1,
      item: { id: 1 },
      availableAt: 0,
      leaseGeneration: null,
      leaseExpiresAt: null,
    };
    const second: RowRecord<{ id: number }> = { ...first, id: 2, item: { id: 2 } };

    store.putBatch([first, second]);
    expect(store.loadAll().map((row) => row.id)).toEqual([1, 2]);
    store.removeBatch([2, 2]);
    expect(store.loadAll().map((row) => row.id)).toEqual([1]);

    const replacement: RowRecord<{ id: number }> = { ...first, item: { id: 3 } };
    store.replaceAll([replacement]);
    expect(store.loadAll()[0]?.item).toEqual({ id: 3 });

    const cyclic = {} as { id: number } & { self?: unknown };
    cyclic.id = 4;
    cyclic.self = cyclic;
    expect(() => store.replaceAll([{ ...first, item: cyclic }])).toThrow();
    expect(store.loadAll()[0]?.item).toEqual({ id: 3 });
    store.close();
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

  it("quotes valid table names that are SQLite keywords", () => {
    const store = createNodeSqliteRowStore<{ id: number }>({
      filename: ":memory:",
      tableName: "order",
    });

    store.put({
      id: 1,
      item: { id: 11 },
      availableAt: 0,
      leaseGeneration: null,
      leaseExpiresAt: null,
    });

    expect(store.loadAll()[0]?.item).toEqual({ id: 11 });
    store.close();
  });

  it("rejects SQLite's reserved internal table namespace", () => {
    expect(() =>
      createNodeSqliteRowStore({ filename: ":memory:", tableName: "sqlite_queue" }),
    ).toThrow("may not start with sqlite_");
  });
});
