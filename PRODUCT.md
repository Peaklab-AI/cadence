# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo freelancers and independent contractors who bill clients by the hour, day, or week. One person, one Mac — the product has no accounts, no multi-device sync, and no concept of a team; everything is scoped to a single local user tracking their own time against their own clients.

## Product Purpose

Cadence is a macOS menu bar time tracker: click the tray icon, pick a project, hit start. It tracks time in the background, checks in if the user walks away mid-session instead of silently padding the timesheet, and keeps a clean per-project, per-period history that can be reviewed, corrected, and marked as billed once invoiced.

## Positioning

Not another browser tab or dashboard to babysit. Where most time trackers are web apps or Electron dashboards demanding a window of their own, Cadence lives entirely in the menu bar as a popover — open it, act, it gets out of the way. It is local-first (a single JSON file on disk) with no account, no server, and no telemetry, which a cloud-backed competitor could not truthfully claim.

## Operating Context

- Lives in the macOS menu bar; opened via left-click on the tray icon, anchored as a popover under it, dismissed by clicking elsewhere.
- Core loop: pick a project → start/stop tracking → periodically review History → mark periods billed once invoiced.
- Data model: Clients → Projects → Time entries. Each project has its own billing interval (hourly, daily, or weekly) and its own rate/currency.
- "Still working on this?" check-ins interrupt idle-but-tracking sessions before they inflate a timesheet.
- Manual entries let the user backfill or correct time after the fact rather than relying on live tracking alone.
- History marks a billing period (by project, by period) as invoiced, so billed vs. unbilled is always visible at a glance.

## Capabilities and Constraints

- Delivered as a Tauri 2 app: React 19 + TypeScript + Tailwind frontend, small Rust core owning the tray icon, timer, and on-disk JSON storage.
- macOS-only by design (tray icon, window chrome, and the curl-installable install flow are all macOS-specific) — this is a durable constraint, not a near-term roadmap gap.
- Local-first storage: a single JSON file on the user's machine. No accounts, no server, no sync, no telemetry.
- Distributed via a signed-less, curl-installable script (`cadence.peaklab.ai/install.sh`) rather than the Mac App Store.
- Popover window is fixed-width (420px) and dynamically resizes its height to fit content, up to a capped maximum — not a freely resizable window.

## Brand Commitments

- Product name: **Cadence**. Publisher: Peaklab Limited (MIT licensed).
- Tagline: "A menu bar time tracker for people who bill by the hour, day, or week."
- Marketing site: cadence.peaklab.ai (`apps/landing` in this repo). Community: Discord.
- Existing brand blue (`brand` token, `#2563EB`) and the Inter typeface are already in use across the app shell and marketing site.

## Evidence on Hand

- App icon at `src-tauri/icons/icon.png`.
- Working implementation of every described feature (tracker, projects/clients, history, billing periods, manual entries) in `src/`.
- No testimonials, case studies, press, or usage metrics exist yet — future work must not fabricate them.

## Product Principles

1. One click, out of your way — the popover model beats a dashboard; every addition should preserve "open it, act, it closes."
2. Local-first, no ceremony — no accounts, no sync setup, no telemetry; trust is earned by owning nothing about the user.
3. Billing accuracy is the product — history, periods, and billed/unbilled state must always read unambiguously, since this is what the user hands to a client.
4. Interruptions should protect the user's invoice, not their attention — check-ins (like the idle prompt) exist to prevent bad data, not to nag.
5. Solo-scale by design — every feature assumes one person, one Mac; do not quietly grow team/multi-user assumptions into the design.
