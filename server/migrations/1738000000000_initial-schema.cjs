/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TYPE geo_point AS (
      lat double precision,
      lon double precision,
      elevation_m double precision
    );

    CREATE TABLE profiles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      default_stretch_thresholds JSONB NOT NULL DEFAULT '{
        "climb_grade_pct": 3,
        "descent_grade_pct": -3,
        "grade_hysteresis_pct": 1,
        "min_stretch_pct": 0.04,
        "min_stretch_m": 50,
        "max_stretch_pct": 0.2,
        "max_stretch_m": 800,
        "resample_spacing_m": 10,
        "grade_window_m": 30
      }'::jsonb,
      year_of_birth INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE activities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sport TEXT,
      started_at TIMESTAMPTZ,
      duration_sec DOUBLE PRECISION,
      distance_m DOUBLE PRECISION,
      avg_hr DOUBLE PRECISION,
      max_hr DOUBLE PRECISION,
      source_format TEXT NOT NULL,
      source_filename TEXT NOT NULL,
      location TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      profile_id INTEGER REFERENCES profiles(id),
      point_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_activities_profile ON activities(profile_id);

    CREATE TABLE track_points (
      id SERIAL PRIMARY KEY,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      sequence INTEGER NOT NULL,
      timestamp TIMESTAMPTZ,
      point geo_point NOT NULL,
      heart_rate INTEGER,
      speed_mps DOUBLE PRECISION,
      distance_m DOUBLE PRECISION,
      lat double precision GENERATED ALWAYS AS ((point).lat) STORED,
      lon double precision GENERATED ALWAYS AS ((point).lon) STORED
    );

    CREATE INDEX idx_track_points_activity ON track_points(activity_id);
    CREATE INDEX idx_track_points_activity_sequence ON track_points(activity_id, sequence);
    CREATE INDEX idx_track_points_lat_lon ON track_points (lat, lon);

    CREATE TABLE segments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      source_activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      start_index INTEGER NOT NULL,
      end_index INTEGER NOT NULL,
      start_point geo_point NOT NULL,
      end_point geo_point NOT NULL,
      radius_m DOUBLE PRECISION NOT NULL DEFAULT 30,
      match_threshold DOUBLE PRECISION NOT NULL DEFAULT 0.90,
      location TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      stretch_source_activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
      stretch_reason TEXT,
      stretch_thresholds JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE segment_reference_points (
      id SERIAL PRIMARY KEY,
      segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      sequence INTEGER NOT NULL,
      point geo_point NOT NULL
    );

    CREATE INDEX idx_segment_reference_points_segment ON segment_reference_points(segment_id);

    CREATE TABLE activity_segment_matches (
      id SERIAL PRIMARY KEY,
      segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      pass_number INTEGER NOT NULL,
      match_score DOUBLE PRECISION NOT NULL,
      start_index INTEGER NOT NULL,
      end_index INTEGER NOT NULL,
      duration_sec DOUBLE PRECISION,
      distance_m DOUBLE PRECISION,
      avg_speed_kmh DOUBLE PRECISION,
      max_speed_kmh DOUBLE PRECISION,
      avg_hr DOUBLE PRECISION,
      max_hr DOUBLE PRECISION,
      elevation_gain_m DOUBLE PRECISION,
      matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX idx_activity_segment_matches_segment ON activity_segment_matches(segment_id);
    CREATE INDEX idx_activity_segment_matches_activity ON activity_segment_matches(activity_id);

    CREATE TABLE geocode_cache (
      cache_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      district TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      provider TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE segment_stretches (
      segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
      stretch_index INTEGER NOT NULL,
      start_point geo_point NOT NULL,
      end_point geo_point NOT NULL,
      length_m DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (segment_id, stretch_index)
    );

    CREATE INDEX idx_segment_stretches_segment ON segment_stretches(segment_id);

    INSERT INTO profiles (name) VALUES ('Default');

    CREATE OR REPLACE FUNCTION geo_gate_bounds(
      gate_lat double precision,
      gate_lon double precision,
      radius_m double precision
    )
    RETURNS TABLE (
      min_lat double precision,
      max_lat double precision,
      min_lon double precision,
      max_lon double precision
    )
    LANGUAGE sql
    IMMUTABLE
    AS $$
      SELECT
        gate_lat - (radius_m / 111320.0),
        gate_lat + (radius_m / 111320.0),
        gate_lon - (radius_m / (111320.0 * cos(radians(gate_lat)))),
        gate_lon + (radius_m / (111320.0 * cos(radians(gate_lat))));
    $$;

    CREATE OR REPLACE VIEW segments_with_gate_bounds AS
    SELECT
      s.id,
      sg.min_lat AS start_gate_min_lat,
      sg.max_lat AS start_gate_max_lat,
      sg.min_lon AS start_gate_min_lon,
      sg.max_lon AS start_gate_max_lon,
      eg.min_lat AS end_gate_min_lat,
      eg.max_lat AS end_gate_max_lat,
      eg.min_lon AS end_gate_min_lon,
      eg.max_lon AS end_gate_max_lon,
      LEAST(sg.min_lat, eg.min_lat) AS union_min_lat,
      GREATEST(sg.max_lat, eg.max_lat) AS union_max_lat,
      LEAST(sg.min_lon, eg.min_lon) AS union_min_lon,
      GREATEST(sg.max_lon, eg.max_lon) AS union_max_lon
    FROM segments s
    CROSS JOIN LATERAL geo_gate_bounds((s.start_point).lat, (s.start_point).lon, s.radius_m) sg
    CROSS JOIN LATERAL geo_gate_bounds((s.end_point).lat, (s.end_point).lon, s.radius_m) eg;
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.sql(`
    DROP VIEW IF EXISTS segments_with_gate_bounds;
    DROP FUNCTION IF EXISTS geo_gate_bounds(double precision, double precision, double precision);
    DROP TABLE IF EXISTS segment_stretches;
    DROP TABLE IF EXISTS geocode_cache;
    DROP TABLE IF EXISTS activity_segment_matches;
    DROP TABLE IF EXISTS segment_reference_points;
    DROP TABLE IF EXISTS segments;
    DROP TABLE IF EXISTS track_points;
    DROP TABLE IF EXISTS activities;
    DROP TABLE IF EXISTS profiles;
    DROP TYPE IF EXISTS geo_point;
  `);
};