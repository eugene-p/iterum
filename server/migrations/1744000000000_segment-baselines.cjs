/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE segment_baselines (
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      aggregation_type TEXT NOT NULL,
      as_of_date DATE NOT NULL,
      sample_count INTEGER NOT NULL,
      typical_duration_sec DOUBLE PRECISION,
      best_duration_sec DOUBLE PRECISION,
      computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (profile_id, segment_id, aggregation_type, as_of_date)
    );

    CREATE INDEX idx_segment_baselines_lookup
      ON segment_baselines (profile_id, segment_id, as_of_date DESC);
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS segment_baselines;`);
};
