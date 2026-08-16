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
  item_is_undefined: number | null;
  available_at: number;
  lease_generation: number | null;
  lease_expires_at: number | null;
  attempt: number | null;
  dlq_handoff_attempt: number | null;
};

const MIGRATED_COLUMNS = ["item_is_undefined", "attempt", "dlq_handoff_attempt"] as const;

const tableNameFrom = (value: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error("SQLite queue table names may contain only letters, numbers, and underscores");
  }
  if (/^sqlite_/i.test(value)) {
    throw new Error("SQLite queue table names may not start with sqlite_");
  }
  return value;
};

const quoteIdentifier = (value: string): string => `"${value.replaceAll('"', '""')}"`;

const ensureMigratedColumns = (db: DatabaseSync, tableName: string): void => {
  const quotedTableName = quoteIdentifier(tableName);
  const existing = new Set(
    (db.prepare(`PRAGMA table_info(${quotedTableName})`).all() as Array<{ name: string }>).map(
      (column) => column.name.toLowerCase(),
    ),
  );
  for (const column of MIGRATED_COLUMNS) {
    if (!existing.has(column)) {
      db.exec(`ALTER TABLE ${quotedTableName} ADD COLUMN ${quoteIdentifier(column)} INTEGER`);
    }
  }
};

const rowFrom = <T>(row: SqliteRow): RowRecord<T> => ({
  id: row.id,
  item: (row.item_is_undefined === 1 ? undefined : JSON.parse(row.item_json)) as T,
  availableAt: row.available_at,
  leaseGeneration: row.lease_generation,
  leaseExpiresAt: row.lease_expires_at,
  ...(row.attempt != null ? { attempt: row.attempt } : {}),
  ...(row.dlq_handoff_attempt != null ? { dlqHandoffAttempt: row.dlq_handoff_attempt } : {}),
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
  const quotedTableName = quoteIdentifier(tableName);
  const db = new DatabaseSync(options.filename);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${quotedTableName} (
      id INTEGER PRIMARY KEY CHECK (id >= 1),
      item_json TEXT NOT NULL,
      item_is_undefined INTEGER NOT NULL DEFAULT 0,
      available_at INTEGER NOT NULL,
      lease_generation INTEGER,
      lease_expires_at INTEGER,
      attempt INTEGER,
      dlq_handoff_attempt INTEGER
    )
  `);
  ensureMigratedColumns(db, tableName);

  const loadAll = db.prepare(`
    SELECT id, item_json, item_is_undefined, available_at, lease_generation, lease_expires_at,
           attempt, dlq_handoff_attempt
    FROM ${quotedTableName}
  `);
  const put = db.prepare(`
    INSERT INTO ${quotedTableName} (
      id, item_json, item_is_undefined, available_at, lease_generation, lease_expires_at,
      attempt, dlq_handoff_attempt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      item_json = excluded.item_json,
      item_is_undefined = excluded.item_is_undefined,
      available_at = excluded.available_at,
      lease_generation = excluded.lease_generation,
      lease_expires_at = excluded.lease_expires_at,
      attempt = excluded.attempt,
      dlq_handoff_attempt = excluded.dlq_handoff_attempt
  `);
  const remove = db.prepare(`DELETE FROM ${quotedTableName} WHERE id = ?`);
  const clear = db.prepare(`DELETE FROM ${quotedTableName}`);

  const write = (record: RowRecord<T>): void => {
    const itemJson = JSON.stringify(record.item);
    if (itemJson === undefined && record.item !== undefined) {
      throw new TypeError("SQLite queue items must be JSON-serializable");
    }
    put.run(
      record.id,
      itemJson ?? "null",
      itemJson === undefined ? 1 : 0,
      record.availableAt,
      record.leaseGeneration,
      record.leaseExpiresAt,
      record.attempt ?? null,
      record.dlqHandoffAttempt ?? null,
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
