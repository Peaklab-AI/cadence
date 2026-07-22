import type { Interval } from "../types";

export const INTERVAL_OPTIONS: { value: Interval; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

type IntervalColorScheme = "brand" | "violet" | "success";

export const INTERVAL_BADGE_META: Record<Interval, { label: string; colorScheme: IntervalColorScheme }> = {
  hourly: { label: "Hourly", colorScheme: "brand" },
  daily: { label: "Daily", colorScheme: "violet" },
  weekly: { label: "Weekly", colorScheme: "success" },
};
