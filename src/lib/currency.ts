// Rendered via a native <select> (see ProjectForm), not the custom
// dropdown Select — its popup is drawn by the OS, so it never needs to
// grow the app's window the way an in-page dropdown would.
export const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "AUD", label: "AUD" },
  { value: "NZD", label: "NZD" },
  { value: "SGD", label: "SGD" },
  { value: "MYR", label: "MYR" },
];

/** Formats a billing amount using the currency's own symbol/decimal
 * convention (e.g. no decimals for JPY) when a currency is set, otherwise
 * falls back to a plain 2-decimal number. */
export function formatCurrency(amount: number, currency: string | null): string {
  if (!currency) return amount.toFixed(2);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}
