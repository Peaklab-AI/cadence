import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTrackerState } from "../hooks/useTrackerState";
import { respondToPrompt } from "../lib/tauriCommands";
import { Button } from "./ui/Button";

// Must match src-tauri/src/timer.rs PROMPT_TIMEOUT_SECS — the deadline
// itself comes from Rust, this is only needed to draw the ring's starting
// point (fraction of time remaining), purely cosmetic.
const PROMPT_TIMEOUT_SECONDS = 120;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function ConfirmPrompt() {
  const snapshot = useTrackerState();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!snapshot) return null;

  const client = snapshot.clients.find((c) => c.id === snapshot.activeClientId);
  const project = snapshot.projects.find((p) => p.id === snapshot.activeProjectId);
  const secondsLeft = snapshot.promptDeadline
    ? Math.max(0, Math.round((new Date(snapshot.promptDeadline).getTime() - now.getTime()) / 1000))
    : null;
  const progress = secondsLeft !== null ? secondsLeft / PROMPT_TIMEOUT_SECONDS : 1;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl bg-white p-6 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="#F1F5F9" strokeWidth="5" />
          <motion.circle
            cx="32"
            cy="32"
            r={RING_RADIUS}
            fill="none"
            stroke="#2563EB"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            animate={{ strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress) }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
        </svg>
        <span className="font-display text-lg font-semibold leading-none tabular-nums text-slate-900">{secondsLeft ?? ""}</span>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Still working on</p>
        <p className="mt-1 font-display text-xl font-semibold text-slate-900">
          {project?.name ?? "this project"}
          {client ? <span className="font-normal text-slate-500"> — {client.name}</span> : ""}?
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => respondToPrompt(false)}>
          No, pause
        </Button>
        <Button variant="primary" onClick={() => respondToPrompt(true)}>
          Yes, keep going
        </Button>
      </div>
    </div>
  );
}
