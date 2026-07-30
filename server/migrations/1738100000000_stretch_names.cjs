/**
 * Optional display names for segment stretches (user-editable).
 * @type {import("node-pg-migrate").MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.addColumn("segment_stretches", {
    name: { type: "text" },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("segment_stretches", "name");
};
