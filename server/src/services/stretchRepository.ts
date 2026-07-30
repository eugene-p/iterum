/* v8 ignore file -- @preserve */
// Integration boundary (DB/HTTP/FS/CLI). Unit coverage ignored; cover via integration tests.

import { geoPointFromRow, geoPointSelect, geoPointSql, pushGeoPoint } from "../db/geoPoint.js";
import { insertInBatches } from "../db/batchInsert.js";
import { query, withTransaction } from "../db/pool.js";
import {
  enrichStretch,
  type Stretch,
  type StretchResult,
  type StretchThresholds,
} from "./stretchSegmentation.js";

export type SavedSegmentStretches = {
  stretches: Stretch[];
  stretch_source_activity_id: number | null;
  stretch_thresholds: StretchThresholds | null;
  stretch_reason: string | null;
};

const parseStoredThresholds = (raw: unknown): StretchThresholds | null => {
  if (!raw || typeof raw !== "object") return null;
  return raw as StretchThresholds;
};

export const loadSegmentStretches = async (
  segmentId: number,
): Promise<SavedSegmentStretches | null> => {
  const meta = await query<{
    stretch_source_activity_id: number | null;
    stretch_thresholds: unknown;
    stretch_reason: string | null;
  }>(
    `SELECT stretch_source_activity_id, stretch_thresholds, stretch_reason
     FROM segments WHERE id = $1`,
    [segmentId],
  );
  if (!meta.rowCount) return null;

  const stretchRows = await query<Record<string, unknown>>(
    `SELECT stretch_index, ${geoPointSelect("start_point", "start")}, ${geoPointSelect("end_point", "end")}, length_m, name
     FROM segment_stretches WHERE segment_id = $1 ORDER BY stretch_index`,
    [segmentId],
  );

  if (!stretchRows.rowCount) return null;

  const row = meta.rows[0];
  const thresholds = parseStoredThresholds(row.stretch_thresholds);
  if (!thresholds) return null;

  return {
    stretches: stretchRows.rows.map((stretch) =>
      enrichStretch(
        {
          index: Number(stretch.stretch_index),
          start: geoPointFromRow(stretch, "start"),
          end: geoPointFromRow(stretch, "end"),
          length_m: Number(stretch.length_m),
          name:
            stretch.name == null || stretch.name === ""
              ? null
              : String(stretch.name),
        },
        thresholds,
      ),
    ),
    stretch_source_activity_id: row.stretch_source_activity_id,
    stretch_thresholds: thresholds,
    stretch_reason: row.stretch_reason,
  };
};

const STRETCH_PARAMS = 10;

export const saveSegmentStretches = async (
  segmentId: number,
  sourceActivityId: number,
  result: StretchResult,
) => {
  await withTransaction(async () => {
    await query(`DELETE FROM segment_stretches WHERE segment_id = $1`, [segmentId]);

    if (result.stretches.length) {
      await insertInBatches(result.stretches.length, STRETCH_PARAMS, async (start, end) => {
        const values: unknown[] = [];
        const placeholders: string[] = [];
        let param = 1;

        for (let i = start; i < end; i++) {
          const stretch = result.stretches[i];
          const name =
            stretch.name != null && String(stretch.name).trim()
              ? String(stretch.name).trim()
              : null;
          values.push(segmentId, stretch.index);
          pushGeoPoint(values, stretch.start);
          pushGeoPoint(values, stretch.end);
          values.push(stretch.length_m, name);
          placeholders.push(
            `($${param},$${param + 1},${geoPointSql(param + 2)},${geoPointSql(param + 5)},$${param + 8},$${param + 9})`,
          );
          param += STRETCH_PARAMS;
        }

        await query(
          `INSERT INTO segment_stretches
            (segment_id, stretch_index, start_point, end_point, length_m, name)
           VALUES ${placeholders.join(", ")}`,
          values,
        );
      });
    }

    await query(
      `UPDATE segments SET
        stretch_source_activity_id = $2,
        stretch_reason = $3,
        stretch_thresholds = $4
       WHERE id = $1`,
      [segmentId, sourceActivityId, result.reason ?? null, JSON.stringify(result.thresholds)],
    );
  });
};

export const deleteSegmentStretches = async (segmentId: number) => {
  await withTransaction(async () => {
    await query(`DELETE FROM segment_stretches WHERE segment_id = $1`, [segmentId]);
    await query(
      `UPDATE segments SET
        stretch_source_activity_id = NULL,
        stretch_reason = NULL,
        stretch_thresholds = NULL
       WHERE id = $1`,
      [segmentId],
    );
  });
};
