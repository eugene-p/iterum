/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import "dotenv/config";
import { pool, query } from "../db/pool.js";
import { loadSegmentStretches } from "../services/stretchRepository.js";
import { computeStretchesForSegment } from "../services/stretchCompare.js";
import { loadFirstMatchedActivityId } from "../services/stretchPoints.js";
import { saveSegmentStretches } from "../services/stretchRepository.js";
import { DEFAULT_STRETCH_THRESHOLDS } from "../services/stretchSegmentation.js";

type SegmentRow = {
  id: number;
  name: string;
  source_activity_id: number;
};

const backfillSegmentStretches = async (segment: SegmentRow, dryRun: boolean): Promise<boolean> => {
  const existing = await loadSegmentStretches(segment.id);
  if (existing?.stretches.length) {
    console.log(`skip segment #${segment.id} (${segment.name}): stretches already saved`);
    return false;
  }

  const firstMatchedActivityId = await loadFirstMatchedActivityId(segment.id);
  const stretchSourceActivityId = firstMatchedActivityId ?? segment.source_activity_id;
  const useActivityPass = stretchSourceActivityId !== segment.source_activity_id;

  const result = await computeStretchesForSegment(
    segment.id,
    stretchSourceActivityId,
    DEFAULT_STRETCH_THRESHOLDS,
    useActivityPass,
  );

  console.log(
    [
      `${dryRun ? "[dry-run] " : ""}segment #${segment.id} (${segment.name})`,
      `stretch source activity #${stretchSourceActivityId}`,
      `${result.stretches.length} stretch${result.stretches.length === 1 ? "" : "es"}`,
      result.reason ? `reason: ${result.reason}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  );

  if (!dryRun) {
    await saveSegmentStretches(segment.id, stretchSourceActivityId, result);
  }

  return true;
};

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes("--dry-run");
  const segmentIdArg = process.argv.find((arg) => arg.startsWith("--segment="));
  const segmentIdFilter = segmentIdArg ? Number(segmentIdArg.split("=")[1]) : null;

  console.log(`Backfill segment stretches${dryRun ? " (dry run)" : ""}`);

  const segments = await query<SegmentRow>(
    segmentIdFilter != null && Number.isFinite(segmentIdFilter)
      ? `SELECT id, name, source_activity_id FROM segments WHERE id = $1 ORDER BY id`
      : `SELECT id, name, source_activity_id FROM segments ORDER BY id`,
    segmentIdFilter != null && Number.isFinite(segmentIdFilter) ? [segmentIdFilter] : [],
  );

  let updated = 0;
  for (const segment of segments.rows) {
    if (await backfillSegmentStretches(segment, dryRun)) {
      updated += 1;
    }
  }

  console.log(`Done. ${dryRun ? "Would update" : "Updated"} ${updated} segment${updated === 1 ? "" : "s"}.`);
};

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });