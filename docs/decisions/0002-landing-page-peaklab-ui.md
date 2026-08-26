# ADR-0002: Rebuild the landing page on @peaklab/ui (React)

## Status
Accepted

## Date
2026-08-22

## Context
`apps/landing` (the marketing site at cadence.peaklab.ai) is a standalone Vite package with no React — a single hand-authored `index.html`, `src/main.ts`, and 674 lines of hand-written CSS custom properties. It has had no substantive edits since its initial commit and has drifted from `peaklab-ui`, peakLab's shared design system: different color tokens, a different type scale, and no shared components.

`peaklab-ui` (`@peaklab/ui`, currently v1.0.1, sibling checkout at `../peaklab-ui`) ships a token set (`--plu-*` custom properties) and 39 React components (Button, Title, Text, Card, Footer, GradientBackground, etc.), styled with CSS Modules and Framer Motion. It's published to a private GitHub Packages registry, but no `.npmrc`/`GITHUB_TOKEN` is configured anywhere on this machine, and `../peaklab-ui/dist` is already built and current (postdates the latest `433367f "revamp"` commit).

We need to decide how deeply the landing page adopts this system.

## Decision
Migrate `apps/landing` to React 19 and consume `@peaklab/ui` as a real dependency, linked to the local sibling checkout (`"@peaklab/ui": "link:../peaklab-ui"` in `apps/landing/package.json`) rather than the private registry. Import `@peaklab/ui/styles.css` for tokens + fonts, and build the page from the library's actual components (`Container`, `Title`, `Text`, `Button`, `Card`, `Tag`, `GradientBackground`, etc.) rather than hand-rolled CSS that approximates them.

Existing page content and information architecture (hero + install CTA + faithful app mockup + minimal footer) is preserved as-is — no new sections are invented (see `docs/plans/landing-page-peaklab-ui-refactor.md`).

## Alternatives Considered

### Tokens-only CSS reskin (keep vanilla TS/HTML)
- Pros: no framework change, smallest diff, no new runtime dependencies (React/framer-motion/lucide-react).
- Cons: still hand-maintains markup/CSS that approximates the design system rather than uses it; doesn't pick up component-level fixes/behavior (motion, focus rings, a11y) from `peaklab-ui`; the exact problem being fixed today (silent drift from the design system) recurs the next time `peaklab-ui` changes.
- Rejected because: it only borrows colors and fonts, not "the latest changes," and leaves the page exactly as easy to drift as it is now.

### Install `@peaklab/ui` from the private GitHub Packages registry
- Pros: matches how a real downstream consumer (outside this monorepo) would install it; no dependency on the sibling checkout's local path.
- Cons: no registry credentials are configured on this machine (`.npmrc`, `GITHUB_TOKEN`), so `pnpm install` would fail immediately; would require provisioning a token as an out-of-band step before any of this work could proceed.
- Rejected because: infeasible right now. Revisit if/when a `GITHUB_TOKEN` with `read:packages` scope for peakLab's org is available in this environment — at that point, swap the `link:` dependency for a normal semver range against the published registry.

## Consequences
- `apps/landing` gains `react`, `react-dom`, `@peaklab/ui`, `framer-motion`, `clsx`, `lucide-react`, and `@vitejs/plugin-react` as dependencies, plus a `vite.config.ts` it didn't previously need.
- The `@peaklab/ui` dependency being `link:../peaklab-ui` means a clean checkout of `cadence` alone cannot build the landing page without `../peaklab-ui` also present on disk (relative sibling). This is a real coupling to flag for CI/deploy — the release pipeline (or `scripts/release.sh`) must either check out `peaklab-ui` alongside `cadence`, or the dependency must be switched to a registry-resolved version (see Alternatives) before landing is deployed from a standalone checkout.
- Future landing-page changes should consume `peaklab-ui` components/tokens rather than writing new bespoke CSS, matching the rest of the org's convention.
- `src/style.css`'s hand-rolled pointer-glow background effect is replaced by `peaklab-ui`'s `GradientBackground`, per `DESIGN.md`'s "don't build ad hoc alternatives" guidance for background treatments.

## Update — 2026-08-26: `link:` dependency broke the Vercel deploy

As predicted above, `apps/landing`'s Vercel build failed (`Rollup failed to resolve import "@peaklab/ui/styles.css"`) once `36f19dc` shipped: Vercel only clones `cadence` itself, so the `link:../../../peaklab-ui` sibling path didn't exist in `/vercel/path0`.

Resolved by vendoring `peaklab-ui`'s built `dist/` into this repo as a local workspace package (`packages/peaklab-ui`, see its `README.md` for update instructions), rather than switching to the private registry — no `GITHUB_TOKEN` is available in this environment yet. `apps/landing`'s dependency is now `"@peaklab/ui": "workspace:*"`. Revisit the registry option (original preferred alternative, above) once a `read:packages` token can be provisioned in Vercel's project settings; that would let `packages/peaklab-ui` be dropped in favor of a normal semver range.
