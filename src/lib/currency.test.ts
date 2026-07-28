import { describe, it, expect } from "vitest";
import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("falls back to a plain 2-decimal number when no currency is set", () => {
    expect(formatCurrency(12.5, null)).toBe("12.50");
  });

  it("uses Intl currency formatting for a valid currency, including a decimal separator", () => {
    const formatted = formatCurrency(1234.5, "USD");
    expect(formatted).toContain(".");
    expect(formatted).toMatch(/1,?234/);
  });

  it("omits decimal places for a zero-decimal currency like JPY", () => {
    const formatted = formatCurrency(1000, "JPY");
    expect(formatted).not.toContain(".");
  });

  it("falls back to toFixed(2) instead of throwing for an invalid currency code", () => {
    expect(formatCurrency(12.5, "NOTACURRENCY")).toBe("12.50");
  });
});
