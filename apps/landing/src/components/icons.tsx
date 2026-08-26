/**
 * Small brand/glyph SVGs specific to this page — not part of @peaklab/ui.
 * Kept as inline components (rather than static assets) so gradients/
 * currentColor styling stay simple and there's no extra network request.
 * The peakLab mark itself lives in @peaklab/ui's `Logo` (see Footer.tsx)
 * rather than here, so it stays in sync with peaklab-ui's brand colors.
 */

/** Cadence's own gradient "sweep" app icon — product identity, distinct from the peakLab mark below. */
export function CadenceMark({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="cadence-sweep" x1="16" y1="5" x2="5" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="50%" stopColor="#2979FF" />
          <stop offset="100%" stopColor="#B388FF" />
        </linearGradient>
        <filter id="cadence-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.18" />
        </filter>
      </defs>
      <circle cx="16" cy="16" r="13" fill="none" stroke="#2563EB" strokeOpacity="0.18" strokeWidth="1.5" />
      <g filter="url(#cadence-shadow)">
        <path d="M 16 5 A 11 11 0 1 1 5 16" fill="none" stroke="url(#cadence-sweep)" strokeWidth="6.5" strokeLinecap="round" />
      </g>
      <circle cx="16" cy="5" r="1.8" fill="#2563EB" />
    </svg>
  );
}

export function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

export function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.375-.444.864-.608 1.25-1.845-.276-3.68-.276-5.487 0-.164-.394-.406-.875-.617-1.25a.077.077 0 0 0-.079-.036c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"
      />
    </svg>
  );
}

export function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <rect x="5.3" y="5.3" width="8" height="8" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3.3 10.3V3.8a1.3 1.3 0 0 1 1.3-1.3h6.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path d="M3 8.5 6.3 11.8 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3.6" y="3" width="3.1" height="10" rx="0.8" fill="currentColor" />
      <rect x="9.3" y="3" width="3.1" height="10" rx="0.8" fill="currentColor" />
    </svg>
  );
}

/** Per-project timers. */
export function TimerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6v3l2.2 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 1.5h4M8 1.5V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Weekly billing groups. */
export function CalendarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="4.3" y="8.5" width="2.6" height="2.6" rx="0.5" fill="currentColor" />
    </svg>
  );
}

/** Grouped by client. */
export function UsersIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5.5" r="2.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.8 13.2c.5-2.3 2.1-3.6 4.2-3.6s3.7 1.3 4.2 3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M10.3 3.4c1.1.2 1.9 1.1 1.9 2.3 0 1.1-.8 2-1.9 2.3M12 9.7c1.5.4 2.5 1.6 2.9 3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** PDF report export. */
export function FileTextIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 1.8h5.2L12.5 5v9.2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2.8a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.2 1.8V5h3.3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4.6 8.4h6M4.6 10.6h6M4.6 12.8h3.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
