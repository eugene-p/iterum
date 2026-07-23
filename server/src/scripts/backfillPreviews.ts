/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import "dotenv/config";
import fs from "node:fs/promises";
import { pool, query } from "../db/pool.js";
import {
  deletePreviewFile,
  ensureActivityPreviewImage,
  ensureSegmentPreviewImage,
} from "../services/routePreview/routePreviewService.js";
import { previewFilePath } from "../services/routePreview/previewStorage.js";

const DEFAULT_DELAY_MS = 200;

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const backfillActivityPreviews = async (
  force: boolean,
  delayMs: number,
): Promise<{ generated: number; skipped: number; failed: number }> => {
  const result = await query<{ id: number; point_count: string }>(
    `SELECT a.id, COUNT(tp.id)::text AS point_count
     FROM activities a
     JOIN track_points tp ON tp.activity_id = a.id
     GROUP BY a.id
     HAVING COUNT(tp.id) >= 2
     ORDER BY a.id`,
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of result.rows) {
    const filePath = previewFilePath("activities", row.id);
    if (!force && (await fileExists(filePath))) {
      skipped += 1;
      continue;
    }

    try {
      if (force) await deletePreviewFile("activities", row.id);
      const buffer = await ensureActivityPreviewImage(row.id);
      if (!buffer) {
        console.log(`skip activity #${row.id}: not enough preview points`);
        skipped += 1;
        continue;
      }
      console.log(`${force ? "regenerated" : "generated"} activity preview #${row.id}`);
      generated += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `failed activity #${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  return { generated, skipped, failed };
};

const backfillSegmentPreviews = async (
  force: boolean,
  delayMs: number,
): Promise<{ generated: number; skipped: number; failed: number }> => {
  const result = await query<{ id: number; point_count: string }>(
    `SELECT s.id, COUNT(srp.id)::text AS point_count
     FROM segments s
     JOIN segment_reference_points srp ON srp.segment_id = s.id
     GROUP BY s.id
     HAVING COUNT(srp.id) >= 2
     ORDER BY s.id`,
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of result.rows) {
    const filePath = previewFilePath("segments", row.id);
    if (!force && (await fileExists(filePath))) {
      skipped += 1;
      continue;
    }

    try {
      if (force) await deletePreviewFile("segments", row.id);
      const buffer = await ensureSegmentPreviewImage(row.id);
      if (!buffer) {
        console.log(`skip segment #${row.id}: not enough reference points`);
        skipped += 1;
        continue;
      }
      console.log(`${force ? "regenerated" : "generated"} segment preview #${row.id}`);
      generated += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `failed segment #${row.id}:`,
        error instanceof Error ? error.message : error,
      );
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  return { generated, skipped, failed };
};

const run = async (): Promise<void> => {
  const force = process.argv.includes("--force");
  const activitiesOnly = process.argv.includes("--activities-only");
  const segmentsOnly = process.argv.includes("--segments-only");
  const delayArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
  const delayMs = delayArg ? Number(delayArg.split("=")[1]) : DEFAULT_DELAY_MS;

  if (activitiesOnly && segmentsOnly) {
    throw new Error("Use only one of --activities-only or --segments-only");
  }

  console.log(
    [
      "Backfill route previews",
      force ? "(regenerating all)" : "(missing only)",
      delayMs > 0 ? `delay ${delayMs}ms between items` : "no delay",
    ].join(" "),
  );

  let activityStats = { generated: 0, skipped: 0, failed: 0 };
  let segmentStats = { generated: 0, skipped: 0, failed: 0 };

  if (!segmentsOnly) {
    activityStats = await backfillActivityPreviews(force, delayMs);
  }
  if (!activitiesOnly) {
    segmentStats = await backfillSegmentPreviews(force, delayMs);
  }

  console.log(
    [
      "Done.",
      `Activities: ${activityStats.generated} generated, ${activityStats.skipped} skipped, ${activityStats.failed} failed.`,
      `Segments: ${segmentStats.generated} generated, ${segmentStats.skipped} skipped, ${segmentStats.failed} failed.`,
    ].join(" "),
  );
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });