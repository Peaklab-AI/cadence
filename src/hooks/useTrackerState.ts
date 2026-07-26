import { useContext } from "react";
import { TrackerContext } from "../context/trackerContextValue";
import type { AppSnapshot } from "../types";

/** Rust is the source of truth; this hook just mirrors its broadcasts.
 * Returns null while loading or if the initial load failed — see
 * `useTrackerLoadState` for the full loading/ready/error picture. */
export function useTrackerState(): AppSnapshot | null {
  const state = useContext(TrackerContext);
  return state.status === "ready" ? state.snapshot : null;
}
