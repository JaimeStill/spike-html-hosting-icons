# Standards

The judgement calls the check can't enforce, one line each, for the standards-reviewer. What
`mise run check` enforces is never restated here.

This repository is the icons layer of spike-html-hosting: per-icon ES modules generated from
Iconify's sets at its build, released by tag, which a consumer takes as a peer.

The architecture pages that apply, in the architecture repository:

- `principles/minimal-footprint.md`
- `principles/rolling-currency.md`
- `principles/independent-releases.md`
- `principles/downward-dependencies.md`

## Provenance

- A copied file names its source repository and commit in a provenance line, which reads
  `From|Adapted from <repo> (<commit>): <path>`.

## Design

- spike-html-apps-foundation v0.3.0 is the browse page's visual baseline: native elements keep
  its styling, and every profile renders as it does there.
- Focus is always visible, motion honours reduced motion, and spacing comes from the
  foundation's tokens, never a literal.
- A UI task's session brief carries the browse page's screenshots per profile; the architect's
  acceptance is the design review.
