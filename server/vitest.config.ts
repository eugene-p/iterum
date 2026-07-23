import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Integration-boundary modules (DB, HTTP, filesystem, CLI) are excluded from
 * unit coverage. Matching sources also carry a file-level v8 ignore hint so the
 * intent is visible next to the code. Cover them later with integration tests.
 */
const integrationCoverageExclude = [
  "src/index.ts",
  "src/scripts/**",
  "src/db/pool.ts",
  "src/db/migrate-runner.ts",
  "src/routes/**",
  "src/middleware/asyncHandler.ts",
  "src/middleware/errorHandler.ts",
  "src/middleware/validate.ts",
  "src/services/activities.ts",
  "src/services/activityLocation.ts",
  "src/services/activityRouteSample.ts",
  "src/services/metadataEnrichment.ts",
  "src/services/metadataPoints.ts",
  "src/services/profiles.ts",
  "src/services/segmentCommands.ts",
  "src/services/segmentMatching.ts",
  "src/services/segmentQueries.ts",
  "src/services/segmentRepository.ts",
  "src/services/segments.ts",
  "src/services/stretchPoints.ts",
  "src/services/stretchRepository.ts",
  "src/services/routePreview/previewStorage.ts",
  "src/services/routePreview/routePreviewService.ts",
  "src/services/routePreview/mapBackground/tileCache.ts",
] as const;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(serverRoot, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    coverage: {
      provider: "v8",
      // Unit suite only instruments pure/logic modules it loads (no `all: true`).
      exclude: [
        "node_modules/**",
        "src/**/*.test.ts",
        "dist/**",
        // Re-export barrels and type-only modules.
        "src/**/index.ts",
        "src/**/types.ts",
        ...integrationCoverageExclude,
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
