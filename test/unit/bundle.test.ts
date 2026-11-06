// The fixture build: test/fixtures/build/entry.js, which imports two Octicons by their set and
// name, bundled by rolldown in memory, its imports resolved through package.json's exports to the
// dist/ mise run build writes. The output holds exactly the markup of the icons it imports, and of
// no other icon the build generated. The bundle reads no network.

import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, test } from "node:test";
import { rolldown } from "rolldown";

const root = join(import.meta.dirname, "../..");
const octicons = join(root, "dist/octicon");

/** Every generated Octicons module's svg string, by icon name, as node imports it. */
async function generatedIcons(): Promise<Map<string, string>> {
  const icons = new Map<string, string>();
  for (const file of readdirSync(octicons).filter((file) => file.endsWith(".js"))) {
    const { default: svg } = await import(pathToFileURL(join(octicons, file)).href);
    assert.equal(typeof svg, "string", `${file} default-exports a string`);
    icons.set(file.slice(0, -".js".length), svg);
  }
  return icons;
}

describe("a fixture build", () => {
  test("carries exactly the imported icons' markup", async () => {
    const bundle = await rolldown({
      input: join(root, "test/fixtures/build/entry.js"),
      logLevel: "silent",
    });
    const { output } = await bundle.generate({ format: "es" });
    await bundle.close();
    assert.equal(output.length, 1, "the build emits one chunk");
    const code = output[0].code;

    // An icon's markup is in the output when its string literal is; rolldown writes a string as
    // JSON writes it. An alias shares its parent's markup, so it is held whenever its parent is.
    const icons = await generatedIcons();
    const imported = new Set([icons.get("check-16"), icons.get("x-16")]);
    const held = [...icons].filter(([, svg]) => code.includes(JSON.stringify(svg)));
    assert.deepEqual(
      held.map(([name]) => name).sort(),
      [...icons]
        .filter(([, svg]) => imported.has(svg))
        .map(([name]) => name)
        .sort(),
    );
    assert.deepEqual(new Set(held.map(([, svg]) => svg)), imported);
    assert.equal(code.match(/<svg /g)?.length, 2, "the output holds two svg elements");
  });
});
