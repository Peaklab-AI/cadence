# @peaklab/ui (vendored)

This is a vendored copy of `@peaklab/ui`'s **built `dist` output**, checked into
`cadence` so `apps/landing` can build from a standalone clone of this repo
(Vercel, CI, or anyone else who doesn't also have `peaklab-ui` checked out as a
sibling directory).

- Vendored from: `peaklab-ui` @ v1.0.1, commit `433367f` ("revamp"), copied 2026-08-26.
- Source of truth remains the `peaklab-ui` repo — this package has no `src/`,
  only the pre-built `dist/`. Do not hand-edit files under `dist/`.
- See `docs/decisions/0002-landing-page-peaklab-ui.md` for why `apps/landing`
  depends on `@peaklab/ui` at all, and why this vendoring approach was chosen
  over resolving it from the private GitHub Packages registry.

## Updating

When `peaklab-ui` changes and the landing page needs the update:

1. `cd ../peaklab-ui && pnpm build`
2. Copy the fresh `dist/` over `packages/peaklab-ui/dist/` in this repo.
3. Bump the `version` in `packages/peaklab-ui/package.json` to match, and
   update the provenance note above (source commit + date).
4. Rebuild `apps/landing` locally to confirm nothing broke, then commit both
   the vendored `dist/` and the landing-page changes together.

If a `GITHUB_TOKEN` with `read:packages` scope ever becomes available in this
environment, prefer switching back to a real registry dependency (see
ADR-0002's alternatives) instead of continuing to hand-vendor `dist/`.
