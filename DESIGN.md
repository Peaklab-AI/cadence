---
name: Cadence
description: A menu bar time tracker for people who bill by the hour, day, or week.
colors:
  working-blue: "#2563EB"
  working-blue-dark: "#1E40AF"
  working-blue-light: "#60A5FA"
  ink: "#0F172A"
  slate-strong: "#334155"
  slate-secondary: "#475569"
  slate-muted: "#64748B"
  slate-faint: "#94A3B8"
  slate-line: "#CBD5E1"
  slate-ring: "#E2E8F0"
  slate-divider: "#F1F5F9"
  slate-recessed: "#F8FAFC"
  surface: "#FFFFFF"
  alert-red: "#EF4444"
  alert-red-strong: "#DC2626"
  alert-red-wash: "#FEF2F2"
  caution-amber: "#D97706"
  caution-amber-strong: "#92400E"
  caution-amber-wash: "#FFFBEB"
  daily-violet: "#6D28D9"
  daily-violet-wash: "#F5F3FF"
  weekly-emerald: "#047857"
  weekly-emerald-wash: "#ECFDF5"
  hourly-blue: "#1D4ED8"
  hourly-blue-wash: "#EFF6FF"
typography:
  display:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.working-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.working-blue-dark}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.working-blue}"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  badge:
    backgroundColor: "{colors.slate-divider}"
    textColor: "{colors.slate-secondary}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  input:
    backgroundColor: "{colors.slate-recessed}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  card-project:
    backgroundColor: "rgba(248, 250, 252, 0.6)"
    rounded: "{rounded.xl}"
    padding: "10px"
---

# Design System: Cadence

## Overview

**Creative North Star: "The Quiet Ledger"**

Cadence looks like a calm, precise bookkeeping companion, not a dashboard. It is flat, small, and gets out of the way the instant its job is done — a popover you glance at, act on, and dismiss. Nothing here competes for attention: one accent color, one typeface, one signature circular control. What personality the system has comes from precision (tabular numerals that never jitter, exact spacing, a restrained interval-color code) rather than decoration.

This is a deliberate departure from the colorful, chart-heavy SaaS dashboards the time-tracking category defaults to (Toggl, Harvest, Clockify). Cadence explicitly rejects category colors, data tables, and dashboard chrome — it never resembles a report you'd study, only a small, correct record you'd trust.

**Key Characteristics:**
- Flat by default; shadow is a rare, deliberate exception, never routine elevation.
- One accent (Working Blue) used sparingly; everything else is slate neutrals plus three small semantic accents for state (red, amber) and interval identity (blue/violet/emerald).
- `rounded-full` pills dominate every interactive control; `rounded-xl` holds every container.
- All numeric/time/currency values render in tabular figures so nothing shifts as digits change.
- Fixed 420px width, dynamic height — the system designs for a small, non-resizable canvas, not a responsive page.

## Colors

Nearly monochrome: a deep slate ink-on-white scale carries almost everything, with Working Blue as the system's only real accent and three small, purposeful semantic/identity accents layered on top.

### Primary
- **Working Blue** (`#2563EB`): the one accent. Used sparingly and only when it means something — the primary action button, focus rings, links, the armed Start button's glow, selected states. Never used decoratively or as a background fill beyond its own button.
- **Working Blue Dark** (`#1E40AF`): hover/pressed state for Working Blue surfaces.
- **Working Blue Light** (`#60A5FA`): text selection highlight only (`::selection`).

### Neutral
- **Ink** (`#0F172A`, slate-900): headings, primary numerals, the most important line in any row.
- **Slate Strong** (`#334155`, slate-700): primary row/label text one step below Ink (e.g. a history period's date range).
- **Slate Secondary** (`#475569`, slate-600): secondary body copy (confirmation prompts, descriptions).
- **Slate Muted** (`#64748B`, slate-500): tertiary text (client names under a project, helper copy).
- **Slate Faint** (`#94A3B8`, slate-400): placeholder text, disabled icons, the least important numeral on a row (amounts, sub-labels), and — deliberately — most secondary action affordances like "Mark billed."
- **Slate Line** (`#CBD5E1`, slate-300): unselected radio/dot outlines.
- **Slate Ring** (`#E2E8F0`, slate-200): the `ring-1 ring-inset` border used on every input/select field instead of a drawn `border`.
- **Slate Divider** (`#F1F5F9`, slate-100): dividers between list rows, hairline rules, hover backgrounds on plain rows, the segmented-control track.
- **Slate Recessed** (`#F8FAFC`, slate-50): the resting background for input fields and recessed info boxes (e.g. the data-folder path).
- **Surface** (`#FFFFFF`): cards, the app shell itself, and the "raised" state of any field on focus/hover.

### Semantic (state)
- **Alert Red** (`#EF4444` icons/borders, `#DC2626` text, wash `#FEF2F2`): destructive actions and errors only — delete confirmations, load failures, validation messages. Never used for anything else.
- **Caution Amber** (`#D97706` text, `#92400E` on-wash text, wash `#FFFBEB`): non-blocking warnings the user should notice but that don't block them — a missing data folder, an overlapping time entry.

### Interval identity (a closed set)
- **Hourly** (`#1D4ED8` on `#EFF6FF`): the hourly-rate badge.
- **Daily** (`#6D28D9` on `#F5F3FF`): the daily-rate badge.
- **Weekly / Success** (`#047857` on `#ECFDF5`): the weekly-rate badge, and reused for "Billed" status — both read as "settled/complete."

### Named Rules
**The One Accent Rule.** Working Blue appears on at most one element per screen doing something (the primary button, the focused field). It is never a background wash, a decorative fill, or a repeated brand flourish.

**The Interval Code Rule.** Blue → hourly, violet → daily, emerald → weekly is a fixed, closed mapping. Never reassign these three colors to anything else, and never introduce a fourth interval color without redesigning the whole code.

## Typography

**Body Font:** Inter (with Segoe UI, sans-serif fallback)
**Display Font:** Inter (same family, used only at the "hero numeral" role — Cadence has one typeface, not a pairing)

**Character:** A single, highly legible grotesque carries the whole system. Personality comes from size, weight, and tabular numerals, not from a second typeface.

### Hierarchy
- **Display** (600, 48px, line-height 1, tracking -0.025em): the live elapsed-time clock and the countdown-prompt numeral — the only two places the type gets loud. Always `tabular-nums`.
- **Title** (600, 20px): short confirmation headings ("Still working on [project]?").
- **Body** (500, 14px): the default UI weight and size — labels, project names, buttons, list rows. Medium (not regular) is the resting weight throughout the system.
- **Label** (500, 12px): metadata and secondary captions (client names, timestamps, helper text). The tracker's status word ("Tracking", "Idle") additionally goes uppercase with wide tracking as a one-off emphasis, not a general label treatment.
- Form inputs deliberately render one step larger than body (16px) for legibility and touch comfort, even though everything around them sits at 14px.

### Named Rules
**The Tabular Numerals Rule.** Every value that ticks, sums, or could realign (elapsed time, durations, currency amounts, countdown seconds) renders with `tabular-nums`. Digits must never cause neighboring text to shift.

## Layout

Cadence is not a responsive page — it is a fixed-width (420px), auto-height native popover, anchored under the macOS menu bar tray icon with its top-left corner pinned (it only grows or shrinks downward). Height is measured from live content and animated between a 200px floor and a 640px ceiling; past the ceiling, the shell itself scrolls — content should never carry its own competing scroll region.

The app shell is a single `rounded-2xl` white card with `16px` padding, sitting on a transparent window background so the OS drop shadow reads as the popover's edge.

Spacing rhythm:
- **24px (lg)** — space above a primary CTA that closes out a screen.
- **16px (md)** — the default gap between unrelated blocks/sections; the dominant rhythm of the system.
- **8px (sm)** — gap between closely related elements (a field and its inline button).
- **6px (xs)** — gap inside a tight inline cluster (an icon and its label, a status dot and its text).

Screens cross-fade via `AnimatePresence mode="wait"`: exit to `opacity 0, y -4px`, enter from `opacity 0, y 4px`, 150ms — the one motion grammar every screen transition shares.

## Elevation & Depth

Flat by default; shadow is the exception, not the system. Depth is conveyed almost entirely through flat tonal layering (white cards over slate-50/recessed panels) and `ring-1 ring-inset` borders instead of drop shadows.

### Shadow Vocabulary
- **Floating overlay** (`shadow-xl`): the only shadow used for genuine elevation — the Select dropdown, which must read as floating above the content beneath it.
- **Selected-tab lift** (`shadow-sm`): a one-step lift on the active SegmentedControl option, just enough to read as "raised," not "floating."
- **Call-to-action glow** (`shadow-lg shadow-brand/25`): a colored glow on the Start button only when armed and ready to press — a deliberate one-off moment of emphasis, not a reusable elevation level.

### Named Rules
**The Flat-By-Default Rule.** Cards, rows, and buttons carry no shadow at rest. Shadow appears only for something genuinely floating above the layout (a dropdown) or one intentional call-to-attention moment — never as routine "card" styling.

## Shapes

Rounding is the system's main geometric signature, applied by role rather than by feel:
- **`rounded-full`** — every interactive pill and circular control: buttons, badges, icon-only buttons, the circular Start/Pause control, status dots. This is the default shape for "you can act on this."
- **`rounded-xl` (12px)** — every container that holds content: History project cards, inputs, the dropdown panel, the data-folder display box.
- **`rounded-lg` (8px)** — smaller nested surfaces: row hover backgrounds, the segmented-control track and its active thumb, inline warning banners.
- **`rounded-2xl` (16px)** — reserved exclusively for the single outermost app shell; never used on any inner element.

Borders overwhelmingly use `ring-1 ring-inset` (a field's definition) rather than a drawn `border`; actual `border`/`divide-y` is reserved for hairline rules between list rows and around the History cards.

## Components

### Buttons
- **Shape:** `rounded-full` always, at two sizes — `sm` (14px/6px padding, 12px text) and `md` (24px/10px padding, 14px text).
- **Primary:** Working Blue fill, white text, `hover:` Working Blue Dark.
- **Outline:** transparent fill, Working Blue text and border, `hover:` a 5%-opacity Working Blue wash.
- **Motion:** every button scales to 1.03 on hover and 0.97 on tap/press (spring, via Framer Motion) — the one interactive-feedback gesture shared by every clickable control in the system.
- **Destructive variant:** the outline button restyled with Alert Red border/text and a red-wash hover, used only behind an explicit "Confirm delete" step — Cadence never puts a bare destructive action one click away.

### Badges
- **Shape:** small `rounded-full` pill, 10px/4px padding, 12px medium text, a matching `ring-1` in the same hue.
- **Palette:** exactly five color schemes — brand (hourly), violet (daily), emerald (weekly/success), gray (neutral/unbilled), warning (amber, unused today but reserved). See the Interval Code Rule.
- **Motion:** mounts with a small scale/opacity pop (0.85→1, 150ms) rather than appearing instantly.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** a faint slate wash (`rgba(248,250,252,0.6)`) over the white shell, with a hairline `slate-100` border — just enough to read as a distinct group without a shadow.
- **Internal Padding:** 10px, with an inner hairline divider (`slate-200/80`) separating the group's header from its rows, and further hairlines between rows.
- **Use:** grouping — e.g. one History card per project, holding that project's periods as divided rows.

### Inputs / Fields
- **Style:** no visible border; a `slate-50` fill with a `ring-1 ring-inset ring-slate-200/70` standing in for a stroke, `rounded-xl`, 16px/12px padding, 16px text (one size larger than surrounding body text).
- **Focus:** fill lifts to white and the ring becomes a 2px Working Blue ring — the field visibly "comes forward" rather than just changing color.
- **Disabled:** stays on the slate-50 fill, text drops to Slate Faint, cursor shows not-allowed.

### The Select dropdown
- A closed-state button matching the Input style, opening a `rounded-xl`, `shadow-xl` panel of hairline-divided options — the one place in the system a floating shadow is used, because it must visually separate from the content it covers.
- Options can carry a sublabel (e.g. client name) and an interval Badge inline — the same badge component used everywhere else, never a bespoke variant.

### The Tracker control (signature component)
The single circular Start/Pause button (56px, `rounded-full`, 2px border) is the system's centerpiece: brand-blue filled with a glow when armed to start, outlined in red with no fill when tracking (press-to-pause). It sits beside the Display-scale elapsed-time numeral (48px, tabular) — together these two elements are the one moment in the whole app allowed to be visually loud; everything else stays quiet by comparison.

## Do's and Don'ts

### Do:
- **Do** keep Working Blue to one meaningful use per screen (see the One Accent Rule).
- **Do** use `tabular-nums` on every value that ticks, sums, or updates live.
- **Do** use `rounded-full` for anything actionable and `rounded-xl` for anything that contains other content.
- **Do** gate every destructive action behind an inline "Confirm delete/overwrite" step rather than a modal — Cadence has no modal system.
- **Do** keep new surfaces flat; reach for `ring-1 ring-inset` and tonal slate backgrounds before reaching for a shadow.

### Don't:
- **Don't** introduce a second accent color for "brand" purposes — the system has exactly one (Working Blue).
- **Don't** reassign the hourly/daily/weekly color code (blue/violet/emerald) to any other meaning.
- **Don't** add drop shadows to routine cards, rows, or buttons — shadow is reserved for floating overlays and the one Start-button glow.
- **Don't** introduce a second typeface or a decorative display font; Inter carries the entire system, including the "hero" numerals.
- **Don't** design dashboard-style chrome (charts, dense tables, category-color legends) — that is the explicit anti-reference this system rejects.
