# Changelog

All notable changes to `@jaimestill/spike-html-hosting-icons` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the package adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-06

### Added

- Octicons, one ES module per icon and alias, imported as `octicon/<name>`, each default-exporting
  the icon's `svg` string, with a declaration that types it as a string.
- Octicons' upstream LICENSE, primer/octicons' at `@primer/octicons@19.42.0`, byte for byte, with
  its provenance line.
- No runtime dependency: each module is a plain string, generated at the layer's build from
  Iconify's `@iconify-json/octicon`, never read at a consumer's.
