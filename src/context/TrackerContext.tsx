import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { listen } from "@tauri-apps/api/event";
import { getState } from "../lib/tauriCommands";
import { toErrorMessage } from "../lib/errors";
import type { AppSnapshot } from "../types";
import { TrackerContext, type TrackerLoadState } from "./trackerContextValue";

// Backoff for auto-retrying a failed initial load (e.g. the backend is
// still starting up, or a slow data folder just needs a moment) — holds at
// the last delay rather than growing unbounded.
const RETRY_DELAYS_MS = [1000, 3000, 8000];

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TrackerLoadState>({ status: "loading" });
  const attempt = useRef(0);
  const retryTimer = useRef<number | undefined>(undefined);
  // Indirection so `load` can schedule/hand out a reference to itself
  // (for the backoff retry and the Retry button) without being read before
  // its own `useCallback` finishes initializing.
  const loadRef = useRef<() => void>(() => {});

  const load = useCallback(() => {
    window.clearTimeout(retryTimer.current);
    getState().then(
      (snapshot) => {
        attempt.current = 0;
        setState({ status: "ready", snapshot });
      },
      (err) => {
        const delay = RETRY_DELAYS_MS[Math.min(attempt.current, RETRY_DELAYS_MS.length - 1)];
        attempt.current += 1;
        retryTimer.current = window.setTimeout(() => loadRef.current(), delay);
        setState({ status: "error", message: toErrorMessage(err), retry: () => loadRef.current() });
      },
    );
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
    const unlisten = listen<AppSnapshot>("state-changed", (event) => {
      setState({ status: "ready", snapshot: event.payload });
    });
    return () => {
      window.clearTimeout(retryTimer.current);
      unlisten.then((fn) => fn());
    };
  }, [load]);

  return <TrackerContext.Provider value={state}>{children}</TrackerContext.Provider>;
}
