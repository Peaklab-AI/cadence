import { createContext } from "react";
import type { AppSnapshot } from "../types";

export const TrackerContext = createContext<AppSnapshot | null>(null);
