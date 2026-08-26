import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@peaklab/ui/reset.css";
import "@peaklab/ui/styles.css";
import { App } from "./App";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root element not found");
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
