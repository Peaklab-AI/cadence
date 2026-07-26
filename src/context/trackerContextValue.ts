import { createContext } from "react";
import type { AppSnapshot } from "../types";

export type TrackerLoadState =
  | { status: "loading" }
  | { status: "ready"; snapshot: AppSnapshot }
  | { status: "error"; message: string; retry: () => void };

export const TrackerContext = createContext<TrackerLoadState>({ status: "loading" });
