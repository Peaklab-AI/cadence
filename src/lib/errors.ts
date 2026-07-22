/** Best-effort human-readable message from a caught value — Tauri command
 * failures typically reject with a plain string, but native/JS errors can
 * surface too. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
