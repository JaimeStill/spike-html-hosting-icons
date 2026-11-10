// The generator, scripts/generate.ts: the licence rule on some refused licences; the fixture sets
// in test/fixtures/sets/, in @iconify-json's layout, generated into scratch directories, so a set's
// name other than a released one's works, and a CC-BY set is refused, a build of sets that holds one
// leaving its output empty; and the released Octicons in the dist/ mise run build writes, with
// their LICENSE byte for byte and its provenance line.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, describe, test } from "node:test";
import {
  generateSet,
  generateSets,
  licenseProblem,
  provenanceFile,
  releasedSets,
  type SetSource,
} from "../../scripts/generate.ts";

const root = join(import.meta.dirname, "../..");
const fixtures = join(root, "test/fixtures/sets");
const scratches: string[] = [];

/** A new temporary directory, removed after the run. */
function scratchDir() {
  const scratch = mkdtempSync(join(tmpdir(), "generate-"));
  scratches.push(scratch);
  return scratch;
}
after(() => {
  for (const scratch of scratches) rmSync(scratch, { recursive: true, force: true });
});

/** A fixture set as a source: its directory, its LICENSE, and a provenance line. */
function fixture(name: string): SetSource {
  const dir = join(fixtures, name);
  return { name, dir, license: join(dir, "LICENSE"), provenance: `the ${name} fixture` };
}

/** The svg string a generated module default-exports, imported as a consumer imports it. */
async function importIcon(path: string): Promise<unknown> {
  return (await import(pathToFileURL(path).href)).default;
}

/** The attributes of the one root svg element `svg` is, by name, or undefined when it isn't one
 * complete svg element. */
function svgAttributes(svg: string): Record<string, string> | undefined {
  const match = svg.match(/^<svg((?:\s+[a-zA-Z:-]+="[^"]*")*)>(.*)<\/svg>$/s);
  if (!match || match[2].includes("<svg")) return undefined;
  return Object.fromEntries(
    [...match[1].matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
  );
}

describe("the licence rule", () => {
  for (const spdx of ["CC-BY-4.0", "CC-BY-SA-4.0", "GPL-2.0-only", "GPL-3.0-or-later", "OFL-1.1"]) {
    test(`refuses ${spdx}, naming the set and its licence`, () => {
      const problem = licenseProblem("some-set", { title: spdx, spdx });
      assert.match(problem ?? "", new RegExp(`^icon set some-set is licensed ${spdx}, `));
    });
  }
  test("refuses a licence with no SPDX identifier, by its title", () => {
    const problem = licenseProblem("some-set", { title: "Free for use" });
    assert.match(problem ?? "", /^icon set some-set is licensed "Free for use" \(no SPDX/);
  });
});

describe("a fixture set", () => {
  const out = scratchDir();
  const names = generateSet(fixture("tiny"), out);

  test("generates one module per icon and alias, hidden ones included", () => {
    assert.deepEqual(names, ["bar-wide", "dot", "point", "ring"]);
    const files = names.flatMap((name) => [`${name}.d.ts`, `${name}.js`]);
    assert.deepEqual(
      readdirSync(join(out, "tiny")).sort(),
      ["LICENSE", provenanceFile, ...files].sort(),
    );
  });

  test("each module default-exports one complete svg: viewBox, 1em square, currentColor, hidden", async () => {
    const viewBoxes: Record<string, string> = {
      "bar-wide": "0 0 24 16",
      dot: "0 0 16 16",
      point: "0 0 16 16",
      ring: "0 0 16 16",
    };
    for (const name of names) {
      const svg = await importIcon(join(out, "tiny", `${name}.js`));
      assert.equal(typeof svg, "string", name);
      const attributes = svgAttributes(svg as string);
      assert.deepEqual(
        attributes,
        {
          xmlns: "http://www.w3.org/2000/svg",
          width: "1em",
          height: "1em",
          viewBox: viewBoxes[name],
          "aria-hidden": "true",
          focusable: "false",
        },
        name,
      );
      assert.ok((svg as string).includes('"currentColor"'), name);
    }
  });

  test("an alias carries its parent's markup", async () => {
    assert.equal(
      await importIcon(join(out, "tiny/point.js")),
      await importIcon(join(out, "tiny/dot.js")),
    );
  });

  test("the LICENSE is copied byte for byte, the provenance line beside it", () => {
    assert.deepEqual(
      readFileSync(join(out, "tiny/LICENSE")),
      readFileSync(join(fixtures, "tiny/LICENSE")),
    );
    assert.equal(readFileSync(join(out, "tiny", provenanceFile), "utf8"), "the tiny fixture\n");
  });

  test("a CC-BY set is refused, naming the set and its licence, and nothing is written", () => {
    const refusedOut = scratchDir();
    assert.throws(
      () => generateSet(fixture("attrib"), refusedOut),
      /^Error: icon set attrib is licensed CC-BY-4.0, /,
    );
    assert.equal(existsSync(join(refusedOut, "attrib")), false);
  });

  test("a set whose prefix isn't its name is refused", () => {
    const source = { ...fixture("tiny"), name: "other" };
    assert.throws(() => generateSet(source, scratchDir()), /its icons.json has the prefix tiny/);
  });

  test("an icon not drawn in currentColor is refused, naming it", () => {
    const dir = join(scratchDir(), "tiny");
    cpSync(join(fixtures, "tiny"), dir, { recursive: true });
    const data = JSON.parse(readFileSync(join(dir, "icons.json"), "utf8"));
    data.icons.dot.body = '<circle cx="8" cy="8" r="4" fill="#000"/>';
    writeFileSync(join(dir, "icons.json"), JSON.stringify(data));
    assert.throws(
      () => generateSet({ ...fixture("tiny"), dir }, scratchDir()),
      /icon set tiny: dot isn't drawn in currentColor/,
    );
  });
});

describe("a build of fixture sets", () => {
  test("generates each set into its own directory", () => {
    const out = scratchDir();
    const built = generateSets([fixture("tiny")], out);
    assert.deepEqual([...built.keys()], ["tiny"]);
    assert.deepEqual(readdirSync(out), ["tiny"]);
  });

  test("a refused set after an accepted one leaves the output empty, naming the set and its licence", () => {
    const out = scratchDir();
    writeFileSync(join(out, "stale.js"), "");
    assert.throws(
      () => generateSets([fixture("tiny"), fixture("attrib")], out),
      /^Error: icon set attrib is licensed CC-BY-4.0, /,
    );
    assert.deepEqual(readdirSync(out), []);
  });
});

describe("the released sets", () => {
  const sets = JSON.parse(readFileSync(join(root, "sets.json"), "utf8"));
  const dist = join(root, "dist");

  test("are built each into its own directory, and nothing else", () => {
    assert.deepEqual(readdirSync(dist).sort(), Object.keys(sets).sort());
  });

  test("the build holds one module and one declaration per Octicons icon and alias", () => {
    const data = JSON.parse(
      readFileSync(join(root, "node_modules/@iconify-json/octicon/icons.json"), "utf8"),
    );
    const icons = [...Object.keys(data.icons), ...Object.keys(data.aliases ?? {})].sort();
    const files = readdirSync(join(dist, "octicon"));
    assert.deepEqual(
      files
        .filter((file) => file.endsWith(".js"))
        .map((file) => file.slice(0, -3))
        .sort(),
      icons,
    );
    assert.deepEqual(
      files
        .filter((file) => file.endsWith(".d.ts"))
        .map((file) => file.slice(0, -5))
        .sort(),
      icons,
    );
  });

  test("x-16 is one complete svg, 1em square, on its 16px viewBox", async () => {
    const svg = await importIcon(join(dist, "octicon/x-16.js"));
    assert.equal(svgAttributes(svg as string)?.viewBox, "0 0 16 16");
    assert.match(svg as string, /^<svg [^>]*width="1em" height="1em"/);
  });

  test("Octicons' LICENSE is primer/octicons' at the recorded commit, byte for byte", () => {
    const license = readFileSync(join(dist, "octicon/LICENSE"));
    assert.deepEqual(license, readFileSync(join(root, sets.octicon.license.path)));
    assert.equal(createHash("sha256").update(license).digest("hex"), sets.octicon.license.sha256);
    assert.match(license.toString("utf8"), /^MIT License\n\nCopyright \(c\) \d{4} GitHub Inc\.\n/);
  });

  test("the provenance line names the upstream repository and commit", () => {
    const line = readFileSync(join(dist, "octicon", provenanceFile), "utf8");
    assert.ok(line.includes("https://github.com/primer/octicons at commit "), line);
    assert.ok(line.includes(sets.octicon.license.commit), line);
  });

  test("a LICENSE that isn't the recorded one fails the build", () => {
    const copy = scratchDir();
    cpSync(join(root, "sets.json"), join(copy, "sets.json"));
    cpSync(join(root, "licenses"), join(copy, "licenses"), { recursive: true });
    writeFileSync(join(copy, sets.octicon.license.path), "MIT License\n");
    assert.throws(() => releasedSets(copy), /licenses\/octicon\/LICENSE has sha256 /);
  });
});
