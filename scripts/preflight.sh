#!/usr/bin/env bash
# Fails naming mise run install when a tool a task needs is missing: the node_modules tooling.
# Adapted from spike-html-hosting-components (99824f7): scripts/preflight.sh, without lit, the
# foundation, and the browser check.
set -euo pipefail

fail() {
  echo "preflight: $1 isn't installed; run mise run install" >&2
  exit 1
}

for bin in eslint prettier; do
  [[ -x node_modules/.bin/$bin ]] || fail "$bin (devDependencies)"
done
