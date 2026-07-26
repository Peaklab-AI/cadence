import { useContext } from "react";
import { TrackerContext } from "../context/trackerContextValue";

/** Full loading/ready/error state — only the top-level screen needs this to
 * tell "still loading" apart from "failed to load and can retry". */
export function useTrackerLoadState() {
  return useContext(TrackerContext);
}
