# spike-html-hosting-icons

The icons layer of spike-html-hosting: one icon toolkit for the spike's GitHub Pages sites and
hosted artifacts, published as `@jaimestill/spike-html-hosting-icons`. Its build generates one ES
module per icon of an Iconify set, through [@iconify/utils](https://github.com/iconify/iconify),
and each module default-exports the icon as one complete `svg` string, so a bundle carries only
the icons it imports. The package has no runtime dependencies, and the components and the SDK
take it as a peer.

It releases [Octicons](https://github.com/primer/octicons) alone, imported by set and name:

```js
import x from "@jaimestill/spike-html-hosting-icons/octicon/x-16";
```

Each module's default export is the icon's `svg`, 1em square on its viewBox, drawn in
`currentColor`, with `aria-hidden="true"` and `focusable="false"`; its declaration types it as a
string. The layer is unreleased: its first release is v0.1.0. Until then package.json's version is
`0.0.0`, and the release workflow cuts no tag.

## Sets and licences

`sets.json` lists the released sets, each read from its `@iconify-json/*` devDependency. The
generator accepts a set only when shipping its licence text satisfies the licence: MIT, ISC,
Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC0-1.0, or Unlicense. It fails the build on any other,
CC-BY, CC-BY-SA, and GPL among them, naming the set and its licence.

`@iconify-json/*` ships no licence text, so each released set's upstream LICENSE is held in
`licenses/<set>/`, byte for byte, and `sets.json` records its sha256 and the upstream repository,
commit, and tag it was fetched from. The build ships it as `dist/<set>/LICENSE`, beside
`LICENSE.provenance`, the line naming that repository and commit. Octicons' is primer/octicons'
LICENSE at commit `9a274e2`, tag `@primer/octicons@19.42.0`.

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
mise run install   # the pinned tools and node_modules; reads the network
mise run build     # generate sets.json's sets into dist/
mise run check     # ESLint, Prettier, shellcheck, actionlint, tsc, the build, and the unit tier;
                   # reads no network
mise run currency  # report every tool, package, and action pin behind its latest
```

A push to main whose `package.json` version has no tag yet releases it: the check, then the pack
committed and tagged, and a GitHub release from `CHANGELOG.md`.

## License

[Apache License 2.0](LICENSE).
