// The browse page's catalog, /browse/catalog.js, which scripts/served.ts makes at its request and
// no file holds: its declaration, which served.ts's catalog() is typed by too.

/** One released set as the browse page shows it: its name, which is its prefix and its directory
 * under dist/; its title, its licence, and its upstream, the repository, tag, and commit its
 * LICENSE was fetched from; and its icon names, every module the build wrote, sorted. */
export interface CatalogSet {
  name: string;
  title: string;
  license: { title: string; spdx: string | undefined; url: string | undefined };
  upstream: { repository: string; tag: string; commit: string };
  icons: string[];
}

/** The released sets, in sets.json's order. */
declare const sets: CatalogSet[];
export default sets;
