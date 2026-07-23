#!/usr/bin/env node
/**
 * Targeted tests + eslint for this monorepo (frontend + server).
 * Usage (from repo root):
 *   npm run validate:target -- <file> [file...]
 *   node scripts/validate-target.mjs <file> [file...]
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const paths = process.argv.slice(2).map((p) => resolve(repoRoot, p));

if (!paths.length) {
  console.error("Usage: validate-target.mjs <file> [file...]");
  process.exit(1);
}

const isFrontend = (p) => p.includes(`${sep}frontend${sep}`);
const isServer = (p) => p.includes(`${sep}server${sep}`);

const toFrontendTestPath = (sourcePath) => {
  if (sourcePath.endsWith(".test.ts")) return sourcePath;
  return sourcePath.replace(/\.tsx?$/, ".test.ts");
};

const toServerTestPath = (filePath) => {
  if (filePath.endsWith(".test.ts")) {
    if (filePath.includes(`${sep}server${sep}test${sep}`)) return filePath;
    const legacyRel = filePath.split(`${sep}server${sep}src${sep}`)[1];
    if (legacyRel) {
      return join(repoRoot, "server", "test", legacyRel);
    }
    return filePath;
  }

  const srcRel = filePath.split(`${sep}server${sep}src${sep}`)[1];
  if (!srcRel) return null;
  return join(repoRoot, "server", "test", srcRel.replace(/\.ts$/, ".test.ts"));
};

const frontendSources = [];
const frontendTests = new Set();
const serverTests = new Set();

for (const filePath of paths) {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  if (isFrontend(filePath)) {
    if (filePath.endsWith(".test.ts")) {
      frontendTests.add(filePath);
    } else if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      frontendSources.push(filePath);
      const testPath = toFrontendTestPath(filePath);
      if (existsSync(testPath)) frontendTests.add(testPath);
    }
  } else if (isServer(filePath)) {
    const testPath = toServerTestPath(filePath);
    if (testPath && existsSync(testPath)) serverTests.add(testPath);
  }
}

let failed = false;

const run = (label, cmd, cwd) => {
  console.log(`\n▶ ${label}`);
  console.log(`  ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: "inherit", shell: true });
  } catch {
    failed = true;
  }
};

if (frontendTests.size) {
  const relTests = [...frontendTests].map((p) =>
    p.replace(/\\/g, "/").split("/frontend/")[1],
  );
  run(
    "Frontend targeted tests",
    `npx vitest run ${relTests.join(" ")}`,
    join(repoRoot, "frontend"),
  );
}

if (frontendSources.length) {
  const relFiles = [...frontendSources, ...frontendTests]
    .map((p) => p.replace(/\\/g, "/").split("/frontend/")[1])
    .filter(Boolean);
  if (relFiles.length) {
    run(
      "Frontend eslint",
      `npx eslint ${relFiles.join(" ")}`,
      join(repoRoot, "frontend"),
    );
  }
}

if (serverTests.size) {
  const relTests = [...serverTests].map((p) =>
    p.replace(/\\/g, "/").split("/server/")[1],
  );
  run(
    "Server targeted tests",
    `npx vitest run ${relTests.join(" ")}`,
    join(repoRoot, "server"),
  );
}

if (!frontendTests.size && !frontendSources.length && !serverTests.size) {
  console.warn("No testable frontend/server paths found in arguments.");
  console.warn("Falling back to full frontend validate.");
  run("Frontend validate", "npm run validate", join(repoRoot, "frontend"));
}

if (failed) {
  console.error("\n✗ Validation failed");
  process.exit(1);
}

console.log("\n✓ Validation passed");
