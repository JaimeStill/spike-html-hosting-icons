// The build (mise run build, and the check's): every released set, as sets.json lists them,
// generated into a fresh dist/ by scripts/generate.ts. A set the generator refuses fails the build,
// naming the set and its licence, and leaves dist/ empty, the sets before it removed too.

import { rmSync } from "node:fs";
import { join } from "node:path";
import { generateSets, releasedSets } from "./generate.ts";

const root = join(import.meta.dirname, "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
try {
  generateSets(releasedSets(root), dist);
} catch (error) {
  console.error(`build: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
