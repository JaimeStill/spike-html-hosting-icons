// The pack: pnpm pack's tarball of the build, extracted into a scratch consumer's node_modules in
// TMPDIR, removed after. Its files are the build and the files every pack carries; its manifest
// declares no runtime dependency; and an icon resolves from it by its set and name, as a consumer
// imports it, in node to its module and under TypeScript's types condition to its declaration,
// which types the icon as a string. It packs the dist/ mise run build writes, and reads no network.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, test } from "node:test";
import ts from "typescript";

const root = join(import.meta.dirname, "../..");
const name = "@jaimestill/spike-html-hosting-icons";
const icon = `${name}/octicon/x-16`;

/** Every file below dir, relative to it with / separators, sorted. */
function listFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((path) => statSync(join(dir, path)).isFile())
    .map((path) => path.split(sep).join("/"))
    .sort();
}

// The consumer: a scratch directory with the tarball's package/ as its installed package.
let scratch: string;
let consumer: string;
let installed: string;
before(() => {
  scratch = mkdtempSync(join(tmpdir(), "pack-"));
  execFileSync("pnpm", ["pack", "--pack-destination", scratch], { cwd: root, stdio: "ignore" });
  const [tarball] = readdirSync(scratch).filter((file) => file.endsWith(".tgz"));
  execFileSync("tar", ["-xzf", join(scratch, tarball), "-C", scratch]);
  consumer = join(scratch, "consumer");
  installed = join(consumer, "node_modules", name);
  mkdirSync(join(consumer, "node_modules/@jaimestill"), { recursive: true });
  renameSync(join(scratch, "package"), installed);
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ type: "module" }));
});
after(() => rmSync(scratch, { recursive: true, force: true }));

/** What node resolves `specifier` to from the consumer, under `conditions`, relative to the
 * installed package. */
function resolveFromConsumer(specifier: string, conditions: string[] = []): string {
  const url = execFileSync(
    process.execPath,
    [
      ...conditions,
      "--input-type=module",
      "-e",
      "console.log(import.meta.resolve(process.argv[1]))",
      specifier,
    ],
    { cwd: consumer, encoding: "utf8" },
  ).trim();
  return relative(installed, fileURLToPath(url)).split(sep).join("/");
}

/** TypeScript's diagnostics on `source`, a consumer module, under node's module resolution. */
function typeCheck(source: string): { messages: string[]; declarations: string[] } {
  const file = join(consumer, "consumer.ts");
  writeFileSync(file, source);
  const program = ts.createProgram([file], {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2024,
    strict: true,
    noEmit: true,
    types: [],
  });
  const messages = ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  const declarations = program
    .getSourceFiles()
    .map((sourceFile) => relative(installed, sourceFile.fileName).split(sep).join("/"))
    .filter((path) => !path.startsWith(".."));
  return { messages, declarations };
}

describe("the pack", () => {
  test("is package.json, README.md, LICENSE, and the build", () => {
    const built = listFiles(join(root, "dist")).map((path) => `dist/${path}`);
    assert.ok(built.includes("dist/octicon/x-16.js"), "mise run build wrote no dist/octicon/");
    assert.deepEqual(
      listFiles(installed),
      [...built, "LICENSE", "README.md", "package.json"].sort(),
    );
  });

  test("ships Octicons' LICENSE and its provenance line beside the modules", () => {
    const files = listFiles(installed);
    assert.ok(files.includes("dist/octicon/LICENSE"));
    assert.ok(files.includes("dist/octicon/LICENSE.provenance"));
  });

  test("declares no runtime dependency, and Iconify's packages only as devDependencies", () => {
    const manifest = JSON.parse(readFileSync(join(installed, "package.json"), "utf8"));
    assert.equal(manifest.dependencies, undefined);
    assert.equal(manifest.peerDependencies, undefined);
    assert.equal(manifest.optionalDependencies, undefined);
    assert.equal(manifest.scripts, undefined);
    for (const dev of ["@iconify/utils", "@iconify/types", "@iconify-json/octicon"]) {
      assert.match(manifest.devDependencies[dev], /^\d+\.\d+\.\d+$/, dev);
    }
  });

  test("an icon resolves by its set and name to its module, a string", async () => {
    assert.equal(resolveFromConsumer(icon), "dist/octicon/x-16.js");
    const svg = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "process.stdout.write((await import(process.argv[1])).default)",
        icon,
      ],
      { cwd: consumer, encoding: "utf8" },
    );
    assert.match(svg, /^<svg [^>]*viewBox="0 0 16 16"[^>]*>.*<\/svg>$/s);
    const built = readFileSync(join(root, "dist/octicon/x-16.js"), "utf8");
    assert.equal(built, `export default ${JSON.stringify(svg)};\n`);
  });

  test("an icon resolves under the types condition to its declaration", () => {
    assert.equal(resolveFromConsumer(icon, ["--conditions=types"]), "dist/octicon/x-16.d.ts");
  });

  test("TypeScript reads the icon's declaration, which types it as a string", () => {
    const { messages, declarations } = typeCheck(
      `import x from "${icon}";\nexport const svg: string = x;\n`,
    );
    assert.deepEqual(messages, []);
    assert.deepEqual(declarations, ["dist/octicon/x-16.d.ts"]);
    const wrong = typeCheck(`import x from "${icon}";\nexport const n: number = x;\n`);
    assert.deepEqual(wrong.messages, ["Type 'string' is not assignable to type 'number'."]);
  });
});
