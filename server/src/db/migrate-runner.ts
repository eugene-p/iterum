/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runner } from "node-pg-migrate";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://fit:fit@localhost:5432/fit_analysis";

const direction = process.argv.includes("down") ? "down" : "up";
const fake = process.argv.includes("--fake");

await runner({
  databaseUrl,
  dir: path.join(__dirname, "../../migrations"),
  direction,
  fake,
  migrationsTable: "pgmigrations",
  log: console.log,
  verbose: true,
});

console.log(`Migrations ${fake ? "faked" : "applied"} (${direction}).`);