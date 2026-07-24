import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, Pause, Play, Plus, Settings } from "lucide-react";
import { formatElapsed } from "../lib/time";
import { formatCurrency } from "../lib/currency";
import type { Project, Status } from "../types";
import { cn } from "./ui/cn";

interface Props {
  status: Status;
  startedAt: string | null;
  canStart: boolean;
  onStart: () => void;
  onPause: () => void;
  onOpenHistory: () => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
  /** The project actually being tracked (not just armed to start), used
   * only to show a subtle live earnings figure for the current session. */
  activeProject: Project | null;
}

const STATUS_META: Record<Status, { label: string; dot: string }> = {
  idle: { label: "Idle", dot: "bg-slate-300" },
  paused: { label: "Paused", dot: "bg-amber-400" },
  tracking: { label: "Tracking", dot: "bg-emerald-500" },
  promptPending: { label: "Confirming…", dot: "bg-brand" },
};

export function TrackerControls({
  status,
  startedAt,
  canStart,
  onStart,
  onPause,
  onOpenHistory,
  onNewProject,
  onOpenSettings,
  activeProject,
}: Props) {
  const isTracking = status === "tracking" || status === "promptPending";
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!isTracking) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [isTracking]);

  const meta = STATUS_META[status];
  const elapsed = isTracking ? formatElapsed(startedAt, now) : "00:00";
  const canToggle = isTracking || canStart;

  // Daily/weekly-rate projects bill a flat amount the moment tracking
  // starts (touching it today already counts as "1 day" elsewhere in the
  // app). Hourly-rate projects only bill whole completed hours — rounded
  // down, not a continuously ticking fractional amount — so this only
  // changes once an hour, not every second.
  let liveEarnings: string | null = null;
  if (isTracking && activeProject?.rate && startedAt) {
    const amount =
      activeProject.interval === "hourly"
        ? activeProject.rate * Math.floor((now.getTime() - new Date(startedAt).getTime()) / 3_600_000)
        : activeProject.rate;
    liveEarnings = formatCurrency(Math.max(0, amount), activeProject.currency);
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isTracking && (
              <span
                className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", meta.dot)}
              />
            )}
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", meta.dot)} />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{meta.label}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onNewProject}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="New project"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="History"
          >
            <History size={16} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[56px_1fr_56px] items-center gap-3">
        <div aria-hidden />

        <div className="flex min-w-0 flex-col items-center gap-0.5">
          <span className="font-display text-5xl font-semibold tabular-nums tracking-tight text-slate-900">
            {elapsed}
          </span>
          {/* Always rendered (just hidden when empty) so the clock never
              jumps up/down as this line appears/disappears — e.g. switching
              to a project with no rate set, or before tracking starts. */}
          <span className={cn("text-xs tabular-nums text-slate-400", !liveEarnings && "invisible")}>
            {liveEarnings ?? "placeholder"} this session
          </span>
        </div>

        <motion.button
          type="button"
          onClick={isTracking ? onPause : onStart}
          disabled={!canToggle}
          whileHover={canToggle ? { scale: 1.03 } : undefined}
          whileTap={canToggle ? { scale: 0.97 } : undefined}
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center justify-self-end rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
            isTracking
              ? "border-red-500 text-red-500 hover:bg-red-50"
              : cn("border-transparent bg-brand text-white hover:bg-brand-dark", canStart && "shadow-lg shadow-brand/25"),
          )}
          aria-label={isTracking ? "Pause" : "Start"}
        >
          {isTracking ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </motion.button>
      </div>
    </div>
  );
}
