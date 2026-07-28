import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { getState, DEFAULT_COMMAND_TIMEOUT_MS, CommandTimeoutError } from "./tauriCommands";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

beforeEach(() => {
  mockedInvoke.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("tauriCommands call() timeout wrapper", () => {
  it("resolves with the invoke result and clears its timer when invoke resolves first", async () => {
    mockedInvoke.mockResolvedValue({ status: "idle" });

    const result = await getState();

    expect(result).toEqual({ status: "idle" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects with CommandTimeoutError once the timeout elapses without invoke settling", async () => {
    mockedInvoke.mockReturnValue(new Promise(() => {})); // never settles

    // attach the rejection handler before advancing timers so the promise
    // is never briefly "unhandled" from Node's perspective
    const caughtPromise = getState().catch((err: unknown) => err);
    await vi.advanceTimersByTimeAsync(DEFAULT_COMMAND_TIMEOUT_MS);
    const caught = await caughtPromise;

    expect(caught).toBeInstanceOf(CommandTimeoutError);
    expect((caught as CommandTimeoutError).command).toBe("get_state");
    expect((caught as CommandTimeoutError).timeoutMs).toBe(DEFAULT_COMMAND_TIMEOUT_MS);
  });

  it("propagates the original rejection when invoke rejects before the timeout", async () => {
    const original = new Error("backend exploded");
    mockedInvoke.mockRejectedValue(original);

    await expect(getState()).rejects.toBe(original);
  });
});
