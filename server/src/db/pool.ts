/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { AsyncLocalStorage } from "node:async_hooks";
import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://iterum:iterum@localhost:5432/iterum";

export const pool = new Pool({ connectionString });

/** Active transaction client, if any. All `query` calls join the current transaction. */
const txStorage = new AsyncLocalStorage<pg.PoolClient>();

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  const client = txStorage.getStore();
  if (client) {
    return client.query<T>(text, params);
  }
  return pool.query<T>(text, params);
}

/**
 * Run `fn` inside a DB transaction. Nested `query` calls automatically use the
 * same client. Nested `withTransaction` reuses the outer transaction (savepoints
 * are not used).
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (txStorage.getStore()) {
    return fn();
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await txStorage.run(client, fn);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
}
