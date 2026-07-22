# Cadence

**A menu bar time tracker for people who bill by the hour, day, or week.**

Cadence lives in your macOS menu bar. Click it, pick a project, hit start. That's the whole interaction model. No browser tab to keep open, no dashboard to babysit. It tracks in the background, nudges you if you've walked away mid-session, and keeps a clean per-project history you can review, edit, and mark as billed.

<p align="center">
  <img src="src-tauri/icons/icon.png" width="96" alt="Cadence icon" />
</p>

<p align="center">
  <a href="https://cadence.peaklab.ai"><img alt="Website" src="https://img.shields.io/badge/website-cadence.peaklab.ai-2563EB"></a>
  <img alt="Platform" src="https://img.shields.io/badge/platform-macOS-black">
  <img alt="Rust" src="https://img.shields.io/badge/rust-2021-DEA584">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-brightgreen"></a>
  <a href="https://discord.gg/K8SAABhaQ"><img alt="Discord" src="https://img.shields.io/badge/chat-Discord-5865F2"></a>
</p>

## Features

- **Menu bar popover, not another window to manage.** Left-click the tray icon to open Cadence anchored right under it; it gets out of your way the moment you click elsewhere.
- **Clients → projects → time entries.** Organize tracked time under the projects you actually bill against.
- **Hourly, daily, or weekly billing intervals**, each with its own rate and currency: a daily-rate project counts as 1 day for any day touched, a weekly one as 1 week, etc.
- **"Still working on this?" check-ins.** If you leave tracking on and walk away, Cadence asks before quietly padding your timesheet.
- **Manual entries.** Forgot to start the timer? Add or edit a time entry after the fact.
- **History, by project and by period**, with the ability to mark a billing period as invoiced so you always know what's been paid out and what hasn't.
- **Local-first.** Everything is stored in a single JSON file on your machine, with no account, no server, no telemetry.

## Install

Cadence ships as a signed-less, curl-installable macOS app. The installer strips the quarantine flag itself, so there's no Gatekeeper "unidentified developer" dance:

```sh
curl -fsSL https://cadence.peaklab.ai/install.sh | bash
```

This downloads the latest build, installs it to `/Applications` (or `~/Applications` if that's not writable), and launches it. Look for the icon in your menu bar afterward.

## Development

Cadence is a [Tauri](https://tauri.app/) app: a React + TypeScript frontend over a small Rust core that owns the tray icon, the timer, and on-disk storage.

```sh
pnpm install
pnpm tauri dev
```

```
src/            React frontend: screens, components, tracker state
src-tauri/src/  Rust backend: tray icon, timer, Tauri commands, JSON storage
apps/landing/   The marketing site at cadence.peaklab.ai
```

Run the frontend's own checks with `pnpm build` (type-checks then builds) and `pnpm lint`. Rust-side tests live alongside the code they test (`cargo test` from `src-tauri/`).

### Releasing

`scripts/release.sh` builds the app, zips the `.app` bundle, and drops it into `apps/landing/public/downloads/` so the next deploy of the landing site serves it from the URL `install.sh` downloads.

## Tech stack

- [Tauri 2](https://tauri.app/) + Rust for the desktop shell, tray icon, and local storage
- React 19 + TypeScript + Tailwind for the UI
- [Framer Motion](https://www.framer.com/motion/) for the small transitions between screens

## License

MIT © Peaklab Limited. See [LICENSE](LICENSE).
