import { DatabaseSync } from "node:sqlite";
import type { RowRecord, RowStore } from "@qkitt/queue";

export type CreateNodeSqliteRowStoreOptions = {
  /** SQLite database filename. Use `:memory:` only for tests. */
  filename: string;
  /**
   * Per-queue table name. A RowStore must not be shared by distinct queues.
   * Defaults to `queue_rows`.
   */
  tableName?: string;
};

export type NodeSqliteRowStore<T> = RowStore<T> & {
  close: () => void;
};

type SqliteRow = {
  id: number;
  item_json: string;
  available_at: number;
  lease_generation: number | null;
  lease_expires_at: number | null;
};

const tableNameFrom = (value: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error("SQLite queue table names may contain only letters, numbers, and underscores");
  }
  return value;
};

const rowFrom = <T>(row: SqliteRow): RowRecord<T> => ({
  id: row.id,
  item: JSON.parse(row.item_json) as T,
  availableAt: row.available_at,
  leaseGeneration: row.lease_generation,
  leaseExpiresAt: row.lease_expires_at,
});

/**
 * Creates a Node.js filesystem-backed SQLite RowStore for one @qkitt/queue
 * queue. This adapter relies on `node:sqlite`, so browser and React Native
 * runtimes need their own platform-specific adapters.
 */
export const createNodeSqliteRowStore = <T>(
  options: CreateNodeSqliteRowStoreOptions,
): NodeSqliteRowStore<T> => {
  const tableName = tableNameFrom(options.tableName ?? "queue_rows");
  const db = new DatabaseSync(options.filename);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY CHECK (id >= 1),
      item_json TEXT NOT NULL,
      available_at INTEGER NOT NULL,
      lease_generation INTEGER,
      lease_expires_at INTEGER
    )
  `);

  const loadAll = db.prepare(`
    SELECT id, item_json, available_at, lease_generation, lease_expires_at
    FROM ${tableName}
  `);
  const put = db.prepare(`
    INSERT INTO ${tableName} (id, item_json, available_at, lease_generation, lease_expires_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      item_json = excluded.item_json,
      available_at = excluded.available_at,
      lease_generation = excluded.lease_generation,
      lease_expires_at = excluded.lease_expires_at
  `);
  const remove = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
  const clear = db.prepare(`DELETE FROM ${tableName}`);

  const write = (record: RowRecord<T>): void => {
    put.run(
      record.id,
      JSON.stringify(record.item),
      record.availableAt,
      record.leaseGeneration,
      record.leaseExpiresAt,
    );
  };

  const runTransaction = (operation: () => void): void => {
    db.exec("BEGIN IMMEDIATE");
    try {
      operation();
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };

  const store: NodeSqliteRowStore<T> = {
    loadAll: () => (loadAll.all() as SqliteRow[]).map(rowFrom<T>),
    put: write,
    remove: (id: number) => {
      remove.run(id);
    },
    clear: () => {
      clear.run();
    },
    putBatch: (records: readonly RowRecord<T>[]) => {
      runTransaction(() => {
        for (const record of records) write(record);
      });
    },
    removeBatch: (ids: readonly number[]) => {
      runTransaction(() => {
        for (const id of ids) remove.run(id);
      });
    },
    replaceAll: (records: readonly RowRecord<T>[]) => {
      runTransaction(() => {
        clear.run();
        for (const record of records) write(record);
      });
    },
    close: () => {
      db.close();
    },
  };

  return store;
};
