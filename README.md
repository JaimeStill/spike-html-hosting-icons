# spike-html-hosting-icons

The icons layer of spike-html-hosting: one icon toolkit for the spike's GitHub Pages sites and
hosted artifacts, published as `@jaimestill/spike-html-hosting-icons`. Its build generates one ES
module per icon of an Iconify set, through [@iconify/utils](https://github.com/iconify/iconify),
and each module default-exports the icon as one complete `svg` string, so a bundle carries only
the icons it imports. The package has no runtime dependencies, and the components and the SDK
take it as a peer.

It releases [Octicons](https://github.com/primer/octicons) alone.

## Install

Each release is a tag, `v<version>`, whose tree is the package as `pnpm pack` builds it:
`package.json`, this README, the LICENSE, and `dist/`; each GitHub release also carries the
tarball. A consumer pins it by its tag:

```
pnpm add github:JaimeStill/spike-html-hosting-icons#v0.1.0
```

## Use

Each icon is imported by its set and its name, `@jaimestill/spike-html-hosting-icons/<set>/<name>`,
as Octicons' `x-16`:

```js
import x from "@jaimestill/spike-html-hosting-icons/octicon/x-16";

button.insertAdjacentHTML("afterbegin", x);
```

Each module's default export is the icon's `svg`, a string: 1em square on its viewBox, so it takes
the text's size, drawn in `currentColor`, so it takes the text's color, with `aria-hidden="true"`
and `focusable="false"`, so the text beside it names it and it never takes focus. Its declaration
types it as a string. Every icon and alias of a set has a module, hidden ones included, so a name
the set has ever answered keeps resolving; the browse page shows them all.

## Sets and licences

| Set | Import | Licence | Upstream |
| --- | --- | --- | --- |
| [Octicons](https://github.com/primer/octicons) | `octicon/<name>` | MIT | primer/octicons, tag `@primer/octicons@19.42.0` |

`sets.json` lists the released sets, each read from its `@iconify-json/*` devDependency. The
generator accepts a set only when shipping its licence text satisfies the licence: MIT, ISC,
Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC0-1.0, or Unlicense. It fails the build on any other,
CC-BY, CC-BY-SA, and GPL among them, naming the set and its licence.

`@iconify-json/*` ships no licence text, so each released set's upstream LICENSE is held in
`licenses/<set>/`, byte for byte, and `sets.json` records its sha256 and the upstream repository,
commit, and tag it was fetched from. The build ships it as `dist/<set>/LICENSE`, beside
`LICENSE.provenance`, the line naming that repository and commit. Octicons' is primer/octicons'
LICENSE at commit `9a274e2`, tag `@primer/octicons@19.42.0`.

### Adding a set

A set is added in a minor release, by three changes: the set's `@iconify-json/<set>` package as an
exact devDependency; its upstream LICENSE in `licenses/<set>/LICENSE`, byte for byte, fetched at
the upstream tag the package's data follows; and its entry in `sets.json`, naming the package, the
LICENSE's path and sha256, and the repository, commit, and tag it was fetched from. The build then
generates it into `dist/<set>/`, or fails naming the set when its licence isn't one of those above.
The version's minor number moves, as the release adds modules and removes none, and the
CHANGELOG's entry names the set and its licence.

## Glyph source

The glyph data comes from [Iconify](https://iconify.design)'s per-set packages, `@iconify-json/*`,
read at the layer's build, never at a consumer's. Iconify is MIT-licensed code from Iconify OÜ,
Estonia. Its data keeps each set's upstream licence, modified by Iconify Tools, and follows each
set's upstream repository, some sets within minutes of an upstream release, others days behind.

Iconify is a single-maintainer risk: one maintainer, cyberalien, made 87% of iconify/iconify's
human commits and 99% of iconify/icon-sets'. The released modules don't depend on it: each is a
plain string, so a release already cut keeps working whatever becomes of Iconify, and only the
next build would need another source of the same set.

## Development

Tasks run through [mise](https://mise.jdx.dev):

```
mise run install                      # the pinned tools, and node_modules with the foundation and the tooling at their tags; reads the network
mise run build                        # generate sets.json's sets into dist/
mise run check                        # lint, types, the build, and the unit and browser tiers; reads no network
mise run browse                       # serve the browse page on a loopback port and print its URL; Ctrl-C stops it
mise run screenshots                  # capture the browse page light and dark, wide and narrow, inline in the terminal
mise run screenshots --palette primer # the same, in the palette named; --space and --type name the other facets
mise run screenshots --all            # every palette at the defaults, then compact and sans at flexoki
mise run screenshots --scheme dark    # only the scheme named, light or dark
mise run screenshots --output browser # a gallery of the captures, opened in the browser; directory keeps the files
mise run screenshots --dir <path>     # write the captures into the directory named
mise run screenshots --keep           # keep the terminal output's captures
mise run currency                     # report every tool, package, and action pin, and the foundation's and the tooling's tags, behind its latest
```

### The browse page

`browse/index.html` is the browse page: every glyph of every released set, by its name, grouped by
set, each set with its licence and its upstream tag, under the foundation of
[spike-html-apps-foundation](https://github.com/JaimeStill/spike-html-apps-foundation), its
profiles chosen through its theme menu, the Theme button or T. It is dev-only: the pack carries
`dist/` alone, so the page and what serves it never ship. `scripts/served.ts` serves it at
`/browse/`, with each glyph the built `dist/<set>/<name>.js`, imported as a consumer imports it,
and its catalog, `/browse/catalog.js`, made from `sets.json` and `dist/` at its request. `mise
run browse` serves it for a reader; it is the layer's capture fixture, which `mise run screenshots`
captures through the `spike-html-apps-screenshots` bin of
[spike-html-apps-tooling](https://github.com/JaimeStill/spike-html-apps-tooling), whole wide and
narrow and with its theme menu open; and the browser tier checks it in the pinned
chrome-headless-shell, in every profile, light and dark, at 1280 and 390 px.

A push to main whose `package.json` version has no tag yet releases it: the check, then the pack
committed and tagged, and a GitHub release from `CHANGELOG.md`.

## License

[Apache License 2.0](LICENSE).
