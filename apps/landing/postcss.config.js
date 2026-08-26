// Deliberately empty: apps/landing is not a Tailwind consumer (styling comes
// from @peaklab/ui/styles.css + CSS Modules). Without this file, Vite falls
// back to the root postcss.config.js and runs the root app's Tailwind
// pipeline over this app's CSS too — this file exists purely to stop that.
export default {
  plugins: {},
};
