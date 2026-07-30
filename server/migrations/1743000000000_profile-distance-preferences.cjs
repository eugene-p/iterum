/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.addColumns("profiles", {
    distance_unit: { type: "text", notNull: true, default: "km" },
    split_distance_m: { type: "double precision", notNull: true, default: 1000 },
  });
  pgm.addConstraint("profiles", "profiles_distance_unit_check", {
    check: "distance_unit IN ('km', 'mi')",
  });
  pgm.addConstraint("profiles", "profiles_split_distance_check", {
    check: "split_distance_m >= 50 AND split_distance_m <= 100000",
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropConstraint("profiles", "profiles_split_distance_check");
  pgm.dropConstraint("profiles", "profiles_distance_unit_check");
  pgm.dropColumns("profiles", ["distance_unit", "split_distance_m"]);
};
