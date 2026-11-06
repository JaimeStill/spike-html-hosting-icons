# spike-html-hosting-icons

The icons layer of spike-html-hosting: one icon toolkit for the spike's GitHub Pages sites and
hosted artifacts, published as `@jaimestill/spike-html-hosting-icons`. Its build generates one ES
module per icon of an Iconify set, through [@iconify/utils](https://github.com/iconify/iconify),
and each module default-exports the icon as one complete `svg` string, so a bundle carries only
the icons it imports. The package has no runtime dependencies, and the components and the SDK
take it as a peer.

It holds no icons yet and is unreleased: its first release is v0.1.0, with Octicons. Until then
package.json's version is `0.0.0`, and the release workflow cuts no tag.

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
mise run check     # ESLint, Prettier, shellcheck, actionlint, and tsc; reads no network
mise run currency  # report every tool, package, and action pin behind its latest
```

A push to main whose `package.json` version has no tag yet releases it: the check, then the pack
committed and tagged, and a GitHub release from `CHANGELOG.md`.

## License

[Apache License 2.0](LICENSE).
