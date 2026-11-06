#!/usr/bin/env bash
# Fails naming mise run install when a tool a task needs is missing: the node_modules tooling, the
# foundation and the tooling at their tags, which the browse page and its tier read, and with
# `browser`, the pinned chrome-headless-shell.
# Adapted from spike-html-hosting-components (99824f7): scripts/preflight.sh, without lit.
set -euo pipefail

fail() {
  echo "preflight: $1 isn't installed; run mise run install" >&2
  exit 1
}

for bin in eslint prettier; do
  [[ -x node_modules/.bin/$bin ]] || fail "$bin (devDependencies)"
done
for package in spike-html-apps-foundation spike-html-apps-tooling; do
  [[ -f node_modules/@jaimestill/$package/package.json ]] ||
    fail "@jaimestill/$package (devDependencies)"
done

[[ "${1:-}" == browser ]] || exit 0
shell=$(mise which chrome-headless-shell 2>/dev/null) || fail "chrome-headless-shell"
# mise caches downloads by checksum: a version bumped without its sha256 installs the old build.
pin=$(mise current http:chrome-headless-shell)
if [[ "$("$shell" --version)" != *" $pin" ]]; then
  echo "preflight: $shell isn't chrome-headless-shell $pin; give the pin its own sha256" >&2
  exit 1
fi
