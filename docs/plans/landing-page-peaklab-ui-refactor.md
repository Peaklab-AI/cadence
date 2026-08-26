# Plan: Landing page refactor onto peaklab-ui

## Status
Done — pending Paul's visual review (see Follow-ups)

## Context
`apps/landing` is Cadence's marketing site at cadence.peaklab.ai. It's a vanilla Vite + TypeScript + hand-written CSS app that hasn't been touched since its initial commit, and its colors/type scale/effects have drifted from `peaklab-ui`, peakLab's shared design system (sibling checkout at `../peaklab-ui`), which was significantly overhauled in its most recent `433367f "revamp"` commit (new fonts, new token names, expanded Button variants, new background components). This plan rebuilds the landing page on that current design system so it stops drifting and starts picking up future `peaklab-ui` changes for free.

## Goal
`apps/landing` renders the same content it does today — hero, install command, faithful Tracker/History app mockup, footer — built from real `@peaklab/ui` React components and `--plu-*` tokens instead of bespoke CSS, visually matching `peaklab-ui`'s current fonts/palette/spacing/motion conventions. `pnpm build:landing` produces a working static build; `pnpm dev:landing` renders correctly in the browser; all current SEO/meta/OG/JSON-LD tags, `install.sh`, `robots.txt`, and `sitemap.xml` are preserved untouched.

## Decisions

| # | Decision point | Options considered | Chosen | Confirmed with Paul |
|---|-----------------|---------------------|--------|----------------------|
| 1 | How deeply to adopt peaklab-ui | (a) Full React + `@peaklab/ui` components, linked to local sibling checkout — (b) tokens-only CSS reskin, keep vanilla TS | (a) Full React migration — see ADR-0002 | 2026-08-22 |
| 2 | Content/section scope | (a) Keep current minimal structure (hero + footer, faithful app mockup) — (b) expand to peaklab-ui's full multi-section marketing composition (NavBar, ServiceCards, ProofPoints, timeline, closing CTA) | (a) Keep current structure, no invented copy/sections | 2026-08-22 |
| 3 | Footer's peakLab credit mark + wordmark | (a) Keep as a hand-copied inline SVG mark + text `<span>` wordmark (original #32 decision) — (b) use `@peaklab/ui`'s own `Logo` component (`variant="lockup-light"`) | (b) Use `Logo` — the hand-copied SVG mark had drifted to peaklab-ui's pre-revamp cyan/blue/purple gradient instead of the current teal/spring one, and the text `<span>` wordmark inherited the page's font and picked up an anchor underline; `Logo` renders the wordmark as real SVG glyph paths (immune to both) and tracks peaklab-ui's brand colors automatically going forward | 2026-08-26 |

## Approach

**Dependency wiring** (per ADR-0002): add to `apps/landing/package.json`:
- deps: `@peaklab/ui` (`link:../peaklab-ui`), `react@^19`, `react-dom@^19`, `framer-motion@^12`, `clsx@^2`, `lucide-react@^0.5xx` (peer deps `@peaklab/ui` requires).
- devDeps: `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`.
- New `apps/landing/vite.config.ts` using `@vitejs/plugin-react`.
- `apps/landing/index.html` keeps its entire `<head>` (SEO/OG/JSON-LD/canonical/favicons) untouched, but `<body>` becomes a single `<div id="root"></div>` + `<script type="module" src="/src/main.tsx">`. Drop the old inline `<svg><symbol>` defs and hand-written background divs — no longer needed once components own their own markup.

**Component structure** (`apps/landing/src`, all new files):
- `main.tsx` — `createRoot(...).render(<App />)`, imports `@peaklab/ui/styles.css` once at entry (ADR-0002).
- `App.tsx` — page shell: `GradientBackground` (tone `mint`, `animated`) wrapping the hero section, then the footer.
- `components/Hero.tsx` — reproduces today's hero: Cadence's own gradient-sweep app icon (existing inline SVG, kept as-is — it's product identity, not `peaklab-ui`'s brand mark), `Title variant="hero" as="h1"` for "Cadence", `Text variant="lead"` for the subtitle/tagline, an `InstallCommand` sub-component (copy-to-clipboard pill — reimplemented as a small React component using `useState`, same behavior as the current `main.ts` logic: 1.5s "copied" state, `prefers-reduced-motion`-safe), a GitHub `ArrowLink`, and `Mockup.tsx`.
- `components/Mockup.tsx` — the Tracker card + History card, rebuilt with `Card`/`Text`/`Title`/`Tag` (or `Badge` for the "Hourly"/"Billed" chips) in place of the current hand-rolled `.tracker-card`/`.history-card` CSS, preserving the exact `role="img"`/`aria-label` a11y pattern and copy (same hours/amount/invoice figures) since it's documented as "a faithful reproduction of the real app's UI."
- `components/Footer.tsx` — **hand-assembled from `Container`/`Text`/`ArrowLink` primitives, not `peaklab-ui`'s `Footer` component.** `Footer`'s contract (`logo` + `description` + `columns: FooterColumn[]` of `href="#"` placeholder links) is built for a multi-column nav footer and has no slot for a live Discord link or the peakLab credit link — forcing today's 3-line footer into it would either break interactivity or need columns Cadence doesn't have. This mirrors `peaklab-ui`'s own `MarketingComposition` story, which likewise composes primitives by hand where a higher-level component's contract doesn't fit. Keep the Discord/GitHub icons as inline SVG (they're identity marks, not `peaklab-ui` components); the peakLab credit itself uses `@peaklab/ui`'s `Logo` component (`variant="lockup-light"`) for both the mark and the "peakLab" wordmark, rather than a hand-copied SVG + text `<span>`, so it tracks peaklab-ui's brand colors automatically and the wordmark can't inherit the page's font/underline (see Decision #3 — the original inline copy).

**Removed**: `apps/landing/src/style.css` (674 lines) and the `main.ts` pointer-glow/copy-button logic — both superseded by `@peaklab/ui/styles.css` + component styles + the new `main.tsx`/`InstallCommand.tsx`.

**Kept as-is, untouched**: `public/install.sh`, `public/robots.txt`, `public/sitemap.xml`, `public/downloads/`, `public/favicon.svg`, `public/apple-touch-icon.png`, and every meta/OG/JSON-LD tag in `index.html`'s `<head>`.

## Task Checklist
- [x] ADR-0002 written and this plan confirmed with Paul
- [x] `apps/landing/package.json` — add deps/devDeps, `vite.config.ts`
- [x] `pnpm install` at repo root, verify `@peaklab/ui` resolves via the `link:` dependency
- [x] `index.html` — strip to `<div id="root">` body, keep `<head>` intact
- [x] `src/main.tsx`, `src/App.tsx`
- [x] `src/components/InstallCommand.tsx` (copy-to-clipboard pill)
- [x] `src/components/Hero.tsx`
- [x] `src/components/Mockup.tsx` (Tracker card + History card)
- [x] `src/components/Footer.tsx`
- [x] Delete `src/style.css`, `src/main.ts`
- [x] `pnpm --filter @cadence/landing typecheck` and `build` both pass, plus root `pnpm lint` and `pnpm test` (42/42) still pass
- [ ] **Visual check via `pnpm dev:landing` — not done by me.** The browser-automation tool in this sandbox can reach the public internet but not `localhost`/`127.0.0.1` (confirmed: `example.com` loads, `localhost:5174` doesn't, `curl` to the same URL returns 200 with correct HTML). Paul needs to eyeball this himself: hero/mockup/footer layout, copy-button behavior, and the ~1024px/640px responsive breakpoints.
- [x] Confirm `apps/landing/postcss.config.js` is still a no-op — turns out load-bearing: removing it lets Vite inherit the root app's Tailwind-enabled `postcss.config.js`, which then runs (harmlessly, but noisily) over `@peaklab/ui`'s plain CSS. Kept, with a comment explaining why.

## Follow-ups / Open Questions
- **Visual review still needed** — see the unchecked checklist item above. Run `pnpm dev:landing` and check the page in a real browser before this ships.
- `../peaklab-ui`'s working tree has uncommitted changes (Button, Field, GradientBackground, Input, MediaFrame, SectionHeader, Select, Tag, Textarea, `bin/init-brand-assets.js`) that postdate its last build — `dist/` (what this refactor actually links against) reflects only the committed `433367f "revamp"` state. `Tag`'s `size` prop, present in that uncommitted source, isn't in the built types, so `Mockup.tsx` doesn't use it. If/when peaklab-ui rebuilds `dist/`, re-check `Mockup.tsx`/`Hero.tsx`/`Footer.tsx` against the new `dist/index.d.ts` for newly-available props worth adopting.
- The `link:../peaklab-ui` dependency couples this build to the sibling checkout being present on disk — flagged in ADR-0002's Consequences as something the release pipeline (`scripts/release.sh` / CI) needs to account for before `apps/landing` is deployed from a standalone `cadence` checkout. Not resolved by this plan.
- If a `GITHUB_TOKEN` for peakLab's GitHub Packages registry later becomes available, swap `link:../peaklab-ui` for a real semver dependency (see ADR-0002 Alternatives).
- **2026-08-26: Decision #2 (structure scope) revisited.** Paul asked for the page to match agency's fuller multi-section composition — see [`landing-page-agency-composition.md`](landing-page-agency-composition.md) for the new decision and approach.
