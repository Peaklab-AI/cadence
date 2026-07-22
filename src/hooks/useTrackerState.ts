import { useContext } from "react";
import { TrackerContext } from "../context/trackerContextValue";
import type { AppSnapshot } from "../types";

/** Rust is the source of truth; this hook just mirrors its broadcasts. */
export function useTrackerState(): AppSnapshot | null {
  return useContext(TrackerContext);
}
