// mise run screenshots' command, the tooling's spike-html-apps-screenshots on
// scripts/screenshots.config.ts, run as the task runs it: the browse page, light, to the terminal,
// with TMPDIR a scratch directory of its own and node's compile cache, which writes there too,
// off. It prints the page's four states' captures under that TMPDIR and leaves it empty, and with
// --keep leaves every capture it printed, so the first run's empty TMPDIR is the output's cleanup,
// not a capture that never wrote. Neither run writes into the repository.
// Adapted from spike-html-hosting-sdk (3a2a381): src/screenshots.ts, its capture, leavesNoCapture,
// and keepsCaptures, on the browse page, as the layer doesn't depend on the SDK.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";

const root = join(import.meta.dirname, "../..");
const config = join(root, "scripts/screenshots.config.ts");
const bin = join(root, "node_modules/.bin/spike-html-apps-screenshots");

/** The repository's files git doesn't ignore and doesn't track: what a run would leave. */
const untracked = () =>
  execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
  });

/** Runs the bin on the capture file: the browse page, light, to the terminal, the flags after, with
 * TMPDIR a fresh scratch directory; returns what the run printed and left there, each path
 * relative to it, and removes the directory. */
function capture(...flags: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "screenshots."));
  try {
    const args = [config, "--page", "browse", "--scheme", "light", "--output", "terminal"];
    const { status, stdout, stderr } = spawnSync(bin, [...args, ...flags], {
      cwd: root,
      env: { ...process.env, TMPDIR: dir, NODE_DISABLE_COMPILE_CACHE: "1" },
      encoding: "utf8",
    });
    const printed = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.endsWith(".png"));
    for (const path of printed) assert.ok(path.startsWith(`${dir}/`), `${path} is under ${dir}`);
    return {
      status,
      stderr,
      printed: printed.map((path) => path.slice(dir.length + 1)),
      left: readdirSync(dir, { recursive: true, encoding: "utf8" }),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("mise run screenshots' command", { timeout: 300_000 }, () => {
  test("captures the browse page's four states under TMPDIR and leaves nothing there", () => {
    const before = untracked();
    const { status, stderr, printed, left } = capture();
    assert.equal(status, 0, stderr);
    for (const state of ["wide", "narrow", "theme-menu-wide", "theme-menu-narrow"]) {
      assert.ok(
        printed.some((path) => path.includes(`-browse-${state}--`)),
        `a capture of browse-${state} among ${printed}`,
      );
    }
    assert.deepEqual(left, [], "TMPDIR is left empty");
    assert.equal(untracked(), before, "the run leaves no file in the repository");
  });

  test("with --keep, leaves every capture file it printed", () => {
    const { status, stderr, printed, left } = capture("--keep");
    assert.equal(status, 0, stderr);
    assert.ok(printed.length > 0, "it printed its captures");
    for (const path of printed) assert.ok(left.includes(path), `${path} is kept`);
  });
});
