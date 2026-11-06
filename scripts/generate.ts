// The icons generator: an Iconify set, read by its name, into one ES module per icon, each
// default-exporting the icon as one complete svg string, with a declaration that types it as a
// string, and the set's LICENSE beside them with the line that names where it came from.
// scripts/build.ts runs it on the released sets, which sets.json lists; the unit tier runs it on
// the fixture sets in test/fixtures/sets/ too, so any set's name works, not only a released one's.
//
// A set is read from a directory in @iconify-json/*'s layout: icons.json, the IconifyJSON icon
// data, and info.json, the IconifyInfo that carries the set's licence. A released set's directory
// is its @iconify-json/<name> package; @iconify-json/* ships no licence text, only the SPDX
// identifier and a URL, so the text is the upstream repository's LICENSE, held in licenses/<name>/
// byte for byte, and sets.json records its sha256, its repository, and its commit.
//
// The generator reads no network: every set is a devDependency or a fixture on disk.

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtendedIconifyIcon, IconifyInfo, IconifyJSON } from "@iconify/types";
import { iconToHTML, iconToSVG, parseIconSet } from "@iconify/utils";

/** The licences whose terms shipping the licence text satisfies, by SPDX identifier: the only ones
 * a set may carry. Any other, CC-BY's and GPL's among them, asks for more than a LICENSE beside
 * the modules (attribution where the icon is shown, or the work's own licence), so its set is
 * refused. */
export const acceptedLicenses = [
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC0-1.0",
  "Unlicense",
];

/** Why the set `name`'s licence, as its info.json gives it, isn't one shipping its text satisfies,
 * or undefined when it is. A licence with no SPDX identifier is refused by its title. */
export function licenseProblem(name: string, license: IconifyInfo["license"]): string | undefined {
  const id = license.spdx;
  if (id !== undefined && acceptedLicenses.includes(id)) return undefined;
  return (
    `icon set ${name} is licensed ${id ?? `"${license.title}" (no SPDX identifier)`}, ` +
    `which shipping its licence text doesn't satisfy; accepted: ${acceptedLicenses.join(", ")}`
  );
}

/** A set to generate: its name, which is its Iconify prefix and its directory under the output;
 * the directory holding its icons.json and info.json; its LICENSE; and the provenance line that
 * names where that LICENSE came from. */
export interface SetSource {
  name: string;
  dir: string;
  license: string;
  provenance: string;
}

/** One entry of sets.json: the @iconify-json package a released set is read from, and its
 * upstream LICENSE, its path in the repository, its sha256, and where it was fetched from. */
interface ReleasedSet {
  package: string;
  license: {
    path: string;
    sha256: string;
    repository: string;
    commit: string;
    tag: string;
  };
}

/** The released sets, as sets.json at `root` lists them, each read from its @iconify-json package
 * as this repository installs it. Throws when a LICENSE isn't byte for byte the one sets.json
 * records. */
export function releasedSets(root: string): SetSource[] {
  const sets: Record<string, ReleasedSet> = JSON.parse(
    readFileSync(join(root, "sets.json"), "utf8"),
  );
  return Object.entries(sets).map(([name, set]) => {
    const license = join(root, set.license.path);
    const sha256 = createHash("sha256").update(readFileSync(license)).digest("hex");
    if (sha256 !== set.license.sha256) {
      throw new Error(
        `icon set ${name}: ${set.license.path} has sha256 ${sha256}, not the ${set.license.sha256} sets.json records`,
      );
    }
    const { repository, commit, tag } = set.license;
    return {
      name,
      dir: dirname(fileURLToPath(import.meta.resolve(`${set.package}/icons.json`))),
      license,
      provenance: `LICENSE is ${repository}/blob/${commit}/LICENSE, byte for byte: ${repository} at commit ${commit}, tag ${tag}.`,
    };
  });
}

/** Icon names as Iconify writes them, which are safe as file names and as subpaths. */
const iconName = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The icon as one complete svg string: its viewBox, 1em square, hidden from assistive technology
 * and out of the tab order, and drawn in currentColor, which the icon's own markup carries. */
export function iconSvg(icon: ExtendedIconifyIcon): string {
  const { attributes, body } = iconToSVG(icon, { width: "1em", height: "1em" });
  return iconToHTML(body, { ...attributes, "aria-hidden": "true", focusable: "false" });
}

/** An icon module's source: the svg string, its default export. */
export function iconModule(svg: string): string {
  return `export default ${JSON.stringify(svg)};\n`;
}

/** Every icon module's declaration: its default export is a string. */
export const iconDeclaration = "declare const svg: string;\nexport default svg;\n";

/** The provenance line's file, beside the LICENSE it describes, so the LICENSE stays byte for
 * byte the upstream's. */
export const provenanceFile = "LICENSE.provenance";

/** Generates the set into `out`/<name>/: <icon>.js and <icon>.d.ts for every icon and alias the
 * set holds, hidden ones included, so a name the set has ever answered keeps resolving; its
 * LICENSE, copied as is; and the provenance line. Throws, generating nothing, on a set whose
 * licence isn't accepted, whose prefix isn't its name, or holding an icon whose name isn't a safe
 * file name or whose markup isn't drawn in currentColor. Returns the icon names, sorted. */
export function generateSet(source: SetSource, out: string): string[] {
  const { name, dir } = source;
  const info: IconifyInfo = JSON.parse(readFileSync(join(dir, "info.json"), "utf8"));
  const problem = licenseProblem(name, info.license);
  if (problem) throw new Error(problem);
  const data: IconifyJSON = JSON.parse(readFileSync(join(dir, "icons.json"), "utf8"));
  if (data.prefix !== name) {
    throw new Error(`icon set ${name}: its icons.json has the prefix ${data.prefix}`);
  }

  const modules = new Map<string, string>();
  parseIconSet(data, (icon, iconData) => {
    if (iconData === null) throw new Error(`icon set ${name}: ${icon} is listed as not found`);
    if (!iconName.test(icon)) throw new Error(`icon set ${name}: ${icon} isn't a safe file name`);
    const svg = iconSvg(iconData);
    if (!svg.includes("currentColor")) {
      throw new Error(`icon set ${name}: ${icon} isn't drawn in currentColor`);
    }
    modules.set(icon, svg);
  });

  const setDir = join(out, name);
  mkdirSync(setDir, { recursive: true });
  for (const [icon, svg] of modules) {
    writeFileSync(join(setDir, `${icon}.js`), iconModule(svg));
    writeFileSync(join(setDir, `${icon}.d.ts`), iconDeclaration);
  }
  copyFileSync(source.license, join(setDir, "LICENSE"));
  writeFileSync(join(setDir, provenanceFile), `${source.provenance}\n`);
  return [...modules.keys()].sort();
}
