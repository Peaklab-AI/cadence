import { useEffect, useState, type ReactNode } from "react";
import { listen } from "@tauri-apps/api/event";
import { getState } from "../lib/tauriCommands";
import type { AppSnapshot } from "../types";
import { TrackerContext } from "./trackerContextValue";

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);

  useEffect(() => {
    getState().then(setSnapshot);
    const unlisten = listen<AppSnapshot>("state-changed", (event) => {
      setSnapshot(event.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return <TrackerContext.Provider value={snapshot}>{children}</TrackerContext.Provider>;
}
