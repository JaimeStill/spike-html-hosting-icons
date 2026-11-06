// The build (mise run build, and the check's): every released set, as sets.json lists them,
// generated into a fresh dist/ by scripts/generate.ts. A set the generator refuses fails the build,
// naming the set and its licence.

import { rmSync } from "node:fs";
import { join } from "node:path";
import { generateSet, releasedSets } from "./generate.ts";

const root = join(import.meta.dirname, "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
try {
  for (const set of releasedSets(root)) generateSet(set, dist);
} catch (error) {
  console.error(`build: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
