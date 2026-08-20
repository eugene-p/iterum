/* v8 ignore file -- @preserve */
// Integration boundary (DB/CLI). Backfill coverage is provided by integration tests.

import "dotenv/config";
import { pool, query } from "../db/pool.js";
import { rebuildSegmentBaselines } from "../services/segmentBaselineAggregator.js";
import { listSegmentAggregators } from "../services/segmentBaselineRegistry.js";

type Pair = { profile_id: number; segment_id: number };

const valuesForOption = (name: string): string[] => {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg.startsWith(`${name}=`)) values.push(arg.slice(arg.indexOf("=") + 1));
    else if (arg === name && process.argv[index + 1] && !process.argv[index + 1].startsWith("--")) {
      values.push(process.argv[index + 1]);
      index += 1;
    }
  }
  return values;
};

const run = async (): Promise<void> => {
  const profileValues = valuesForOption("--profile-id");
  const segmentValues = valuesForOption("--segment-id");
  const typeValues = valuesForOption("--type");
  const profileId = profileValues.length ? Number(profileValues.at(-1)) : null;
  const segmentId = segmentValues.length ? Number(segmentValues.at(-1)) : null;
  if (profileId != null && (!Number.isInteger(profileId) || profileId <= 0)) {
    throw new Error("--profile-id must be a positive integer");
  }
  if (segmentId != null && (!Number.isInteger(segmentId) || segmentId <= 0)) {
    throw new Error("--segment-id must be a positive integer");
  }
  const aggregationTypes = typeValues.length ? typeValues : undefined;
  if (aggregationTypes) {
    const known = new Set(listSegmentAggregators().map((aggregator) => aggregator.type));
    for (const type of aggregationTypes) {
      if (!known.has(type)) throw new Error(`Unknown segment aggregation type: ${type}`);
    }
  }

  const filters = [
    "a.profile_id IS NOT NULL",
    "m.duration_sec IS NOT NULL",
    "m.duration_sec > 0",
    "m.duration_sec < 'Infinity'::double precision",
  ];
  const params: unknown[] = [];
  if (profileId != null) {
    params.push(profileId);
    filters.push(`a.profile_id = $${params.length}`);
  }
  if (segmentId != null) {
    params.push(segmentId);
    filters.push(`m.segment_id = $${params.length}`);
  }
  const pairs = await query<Pair>(
    `SELECT DISTINCT a.profile_id, m.segment_id
     FROM activity_segment_matches m
     JOIN activities a ON a.id = m.activity_id
     WHERE ${filters.join(" AND ")}
     ORDER BY a.profile_id, m.segment_id`,
    params,
  );

  for (const pair of pairs.rows) {
    await rebuildSegmentBaselines({
      profileId: pair.profile_id,
      segmentId: pair.segment_id,
      aggregationTypes,
    });
    console.log(`rebuilt profile #${pair.profile_id} × segment #${pair.segment_id}`);
  }
  console.log(`Done. Rebuilt ${pairs.rowCount ?? 0} pair${pairs.rowCount === 1 ? "" : "s"}.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
