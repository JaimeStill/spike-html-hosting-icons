// What the browse page is served from: the repository root, whose browse/index.html is the page,
// sent for every extensionless path, so it is /browse/; the built dist/, whose modules the page
// imports as /dist/<set>/<icon>.js; the foundation, under /deps/, which the page's import map
// names; and the page's catalog, /browse/catalog.js, made from sets.json, each set's info.json,
// and dist/ at each request, written to no file. The browser tier, the screenshots description,
// and mise run browse all serve it through spike-html-apps-tooling's serve, so it is kept here
// once.
// Adapted from spike-html-hosting-components (aa9d491): test/browser/support/served.ts, its serve
// options and a handler that makes a module at its request, without lit and the fixture sites.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { IconifyInfo } from "@iconify/types";
import type { Handler, ServeOptions } from "@jaimestill/spike-html-apps-tooling/server.js";
import type { CatalogSet } from "../browse/catalog.d.ts";
import type { ReleasedSet } from "./generate.ts";

/** The repository root, the served tree. */
export const root = join(import.meta.dirname, "..");

/** The page, under the root, and its path under the origin. */
export const shell = "browse/index.html";
export const PAGE = "/browse/";

/** The catalog module's path under the origin. */
export const CATALOG = "/browse/catalog.js";

/** The released sets, in sets.json's order, as the build at `root`'s dist/ holds them. Throws when
 * a set isn't built. */
export function catalog(root: string): CatalogSet[] {
  const sets: Record<string, ReleasedSet> = JSON.parse(
    readFileSync(join(root, "sets.json"), "utf8"),
  );
  return Object.entries(sets).map(([name, set]) => {
    const info: IconifyInfo = JSON.parse(
      readFileSync(join(root, "node_modules", set.package, "info.json"), "utf8"),
    );
    const icons = readdirSync(join(root, "dist", name))
      .filter((file) => file.endsWith(".js"))
      .map((file) => file.slice(0, -".js".length))
      .sort();
    const { repository, tag, commit } = set.license;
    return {
      name,
      title: info.name,
      license: { title: info.license.title, spdx: info.license.spdx, url: info.license.url },
      upstream: { repository, tag, commit },
      icons,
    };
  });
}

/** Claims the request for the catalog, answering with a module whose default export is
 * catalog(root)'s, made at the request; passes on every other request. */
export const handler: Handler = (request, response) => {
  const { pathname } = new URL(request.url ?? "/", "http://localhost");
  if (pathname !== CATALOG) return false;
  const body = `export default ${JSON.stringify(catalog(root))};\n`;
  response
    .writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" })
    .end(body);
  return true;
};

/** The serve options for the browse page: the root, its shell, the foundation, and the catalog. */
export const served: ServeOptions = {
  root,
  shell,
  deps: ["@jaimestill/spike-html-apps-foundation"],
  handler,
};
