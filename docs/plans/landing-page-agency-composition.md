# Plan: Landing page — full agency-style composition

## Status
Done — visually verified via headless Chrome (see Task Checklist)

## Context
`docs/plans/landing-page-peaklab-ui-refactor.md` (Done, 2026-08-22) migrated `apps/landing` onto `@peaklab/ui` but deliberately kept the page's *structure* unchanged — hero + footer only, no new sections (that plan's Decision #2). Paul is now asking to base the page's design on `../../../agency` (peakLab's own marketing site, sibling checkout at `/Users/paul.b/work/agency`), which itself runs on `@peaklab/ui` but composes a full multi-section marketing page. This plan revisits Decision #2 and builds that fuller composition for Cadence.

Confirmed via `AnimatedBackground`/`ProofPoint`/`StepCard`/`NavBar`/`SectionHeader` all being real `@peaklab/ui` exports (checked in `../../../peaklab-ui/dist/index.d.ts`), not agency-local code — agency's own `AnimatedHero`/`ClosingCTA`/`SiteNavBar`/`SiteFooter`/`HowWeWork` are local *compositions* of those library primitives (plus `react-router-dom`, which this single-page site doesn't have). So this plan ports the composition pattern, not code, and adapts it to Cadence's actual (single-page, no routing) content.

## Goal
`cadence.peaklab.ai` reads as a complete, professional product page at agency's polish level: floating `NavBar`, an animated hero background (matching agency's `AnimatedHero` treatment), a "how it works" section, a proof-points strip, a closing CTA, and a restyled footer — while inventing zero new product claims. Every new section restates facts already present in this repo (today's hero paragraph, footer line, and `index.html`'s existing JSON-LD `price: "0"` / `operatingSystem: "macOS 13+"`), just given the visual structure agency uses to present equivalent facts about itself.

## Decisions

| # | Decision point | Options considered | Chosen | Confirmed with Paul |
|---|-----------------|---------------------|--------|----------------------|
| 1 | How far to go toward matching agency's design | (a) polish only, same hero+footer structure — (b) add a floating NavBar on top of (a) — (c) full multi-section composition (NavBar, animated hero, how-it-works, proof points, closing CTA, restyled footer) | (c) Full multi-section composition | 2026-08-26 |
| 2 | Section plan / content mapping | Build as proposed (NavBar + AnimatedHero-style background + "How it works" 3-step + proof-points strip + closing CTA + restyled footer, using only facts already stated in today's copy) — vs. drop "How it works" (redundant with hero paragraph) — vs. drop closing CTA (redundant with hero's install command) | Build as proposed, all sections included | 2026-08-26 |

## Approach

**`components/NavBar.tsx`** (new) — wraps `@peaklab/ui`'s `NavBar` (`floating`), `CadenceMark` + wordmark as `logo`, single nav item "How it works" (scrolls to the how-it-works section), `ctaLabel="Install"` (scrolls to the hero's install pill), `secondaryLabel="GitHub"` (opens the repo in a new tab). No `react-router` — `onNavigate` branches on the clicked label and calls `scrollIntoView`/`window.open` directly, since this is a single page. Reserves `--site-nav-height` via a `ResizeObserver` on the rendered header, same pattern as agency's `SiteNavBar.tsx`, so the hero can clear the fixed bar without a hardcoded offset.

**`components/Hero.tsx`** (edit) — swap the current `GradientBackground` wrapper (moved out of `App.tsx`) for `AnimatedBackground` (`grid`, no `background` tone — omitting it keeps Cadence's paper page background instead of importing agency's blue "sky" wash, since Cadence's own accent is mint) plus agency's `titleGlow` CSS pattern (a `--plu-gradient-brand` radial glow behind the "Cadence" headline, masked to fade before the box edge, `isolation: isolate` stacking so glow/photo-layer/text compare correctly — ported as CSS, not the `AnimatedHero` React component itself, since that component is hardwired to `react-router-dom` `Link`s and a "book a call" `Button` CTA that don't fit Cadence's install-pill CTA). Copy, mockup, and install command are unchanged.

**`components/ProofPoints.tsx`** (new) — flat `--plu-surface-page` strip directly under the hero (matches agency's `AnimatedHero` proof-points band), four `ProofPoint`s, all restating existing facts: "Free & open source" (JSON-LD `price: "0"` + the existing GitHub link/copy), "Native macOS app" (existing OG/meta description), "No account, no server" and "Everything in one file" (both already in today's footer copy).

**`components/HowItWorks.tsx`** (new) — `SectionHeader` + three `StepCard`s (`index`/`title`/`body`, no invented `tags`/`art`) on a `--plu-color-mint-wash` section background. The three steps are the existing hero paragraph ("Track time against a project" → "Cadence groups it into a total every week" → "Mark it billed once you've sent the invoice") split into steps, not new copy. Uses `StepCard` directly rather than porting agency's scroll-driven rail timeline (`HowWeWork.tsx`) — that's agency-specific motion polish or a genuinely new shared pattern, out of scope here (see Follow-ups).

**`components/ClosingCTA.tsx`** (new) — full-bleed `GradientBackground` (`tone="brand"`) section: `Title` "Install Cadence", the same fact line already in the hero ("Paste into Terminal. Installs to /Applications and launches Cadence."), the existing `InstallCommand` component repeated, and the GitHub `ArrowLink`. No new claims — same CTA as the hero, given agency's closing-CTA treatment.

**`components/Footer.tsx`** (edit) — kept hand-assembled per ADR-0002/the prior plan's reasoning (`@peaklab/ui`'s `Footer` contract still has no slot for a live Discord link), but restyled: split into a main row + a separate legal bar (agency's `SiteFooter` two-tier pattern), tightened spacing/type to match. Same links and copy as today.

**`App.tsx`** (edit) — composes `NavBar → Hero → ProofPoints → HowItWorks → ClosingCTA → Footer`, alternating section backgrounds per `DESIGN.md` §6 convention: page → page (proof points) → mint-wash (how it works) → page → `gradient-brand` (closing CTA) → page (footer).

## Task Checklist
- [x] This plan confirmed with Paul (Decisions above)
- [x] Verify `AnimatedBackground`/`ProofPoint`/`StepCard`/`NavBar`/`SectionHeader` are real `@peaklab/ui` exports (checked `dist/index.d.ts`)
- [x] `components/NavBar.tsx` + module CSS
- [x] `components/Hero.tsx` — `AnimatedBackground` + titleGlow treatment
- [x] `components/ProofPoints.tsx`
- [x] `components/HowItWorks.tsx`
- [x] `components/ClosingCTA.tsx`
- [x] `components/Footer.tsx` restyle
- [x] `App.tsx` composition + background alternation
- [x] `pnpm --filter @cadence/landing typecheck` and `build` pass
- [x] **Visual review** — the Chrome extension (`claude-in-chrome`) wasn't connected this session, so this was done via headless Chrome screenshots (`--headless --screenshot`) plus a direct CDP connection (`Emulation.setDeviceMetricsOverride` + `Runtime.evaluate` querying `getBoundingClientRect()`), run from an isolated `--user-data-dir` (not the user's real Chrome profile). This caught two real bugs the first pass missed, both now fixed:
  - `AnimatedBackground`'s beams render in fixed white and are invisible without a tinted wash — `Hero.tsx` had omitted `background="sky"` to avoid importing a "foreign" tint, which made the hero read as empty. Fixed by adding it back; Cadence's own app icon is blue/cyan/purple, so it reads as on-brand.
  - `ClosingCTA.tsx` wrapped content in the `GradientBackground` *component* (a soft near-white ambient mesh) with white/inverse text — nearly unreadable. Agency's real `ClosingCTA.module.css` instead applies the `--plu-gradient-brand` *token* directly as a flat background with dark ink text; fixed to match.
  - Bonus catch, not part of the original section-plan scope: `App.module.css`'s `.heroGrid` mobile breakpoint used bare `grid-template-columns: 1fr` (= `minmax(auto, 1fr)`) instead of `minmax(0, 1fr)` like the desktop version — the install command's unbreakable URL text set the track's automatic minimum size to its full unwrapped width, overflowing narrow viewports. This is a pre-existing bug (unrelated to this plan's new sections), newly *visible* as silently clipped content once `Hero.module.css` added `overflow: hidden` on `.heroTop`. Fixed at the source (`minmax(0, 1fr)` + `min-width: 0` on `.heroCopy`/`.ctaRow`) rather than removing the `overflow: hidden`. Verified overflow-free at 320/375/390/768/1024/1440px via the CDP script.

## Follow-ups / Open Questions
- Agency's `HowWeWork.tsx` scroll-driven rail timeline (progress-filled connecting line between steps) wasn't ported — the original `HowItWorks.tsx` used plain `StepCard`s instead. Moot now that the section was replaced (see 2026-08-26 update below), but the same "new pattern belongs in `@peaklab/ui`" guidance would apply if a rail timeline is wanted for `Features` later.
- Same `link:../../../peaklab-ui` coupling flagged in ADR-0002 applies unchanged here — no new dependency decisions made in this plan.
- The `claude-in-chrome` extension wasn't connected this session; the headless-Chrome+CDP workaround above is a reasonable substitute but isn't the same as Paul actually clicking around the live page (scroll-pin behavior on `NavBar`, hover states, copy-to-clipboard feedback). Worth a real once-over when convenient.

### 2026-08-26 — "How it works" replaced with "Features"
Paul asked to swap the 3-step `HowItWorks` walkthrough (Decision #2 above) for a capabilities-style `Features` section. Confirmed with Paul: content drafted from real capabilities already documented elsewhere in this repo rather than invented copy (per-project timers and weekly billing groups from the original hero/step copy, plus client-grouped history and date-range PDF export from `docs/plans/history-client-grouping.md` and `docs/plans/pdf-report-for-date-range.md`), and built with `@peaklab/ui`'s `ServiceCard` (Paul's choice over a plain title/body card) — each card's CTA links to the GitHub repo since this single-page site has no per-feature page to send visitors to. `components/HowItWorks.tsx`/`.module.css` removed; `components/Features.tsx`/`.module.css` added; `NavBar.tsx`'s nav item and anchor id renamed from "How it works"/`how-it-works` to "Features"/`features`; `App.tsx` composition updated to match.
