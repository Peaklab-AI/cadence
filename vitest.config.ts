import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    // History/billing math is always anchored to NZ time (see
    // src/lib/nzTime.ts), independent of the host's own timezone — pin the
    // test runner's own zone so date/time tests are deterministic
    // regardless of which machine (or which timezone Paul is traveling in)
    // runs them.
    env: { TZ: "UTC" },
  },
});
