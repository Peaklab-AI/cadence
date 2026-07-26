import { CommandTimeoutError } from "./tauriCommands";

/** Best-effort human-readable message from a caught value — Tauri command
 * failures typically reject with a plain string, but native/JS errors can
 * surface too. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof CommandTimeoutError) {
    return `${err.message} — check your data folder's connection and try again.`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
