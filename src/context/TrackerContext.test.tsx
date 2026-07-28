import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { TrackerProvider } from "./TrackerContext";
import { useTrackerLoadState } from "../hooks/useTrackerLoadState";
import { getState } from "../lib/tauriCommands";
import type { AppSnapshot } from "../types";

vi.mock("../lib/tauriCommands", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/tauriCommands")>();
  return { ...actual, getState: vi.fn() };
});

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

const mockedGetState = vi.mocked(getState);

const snapshot: AppSnapshot = {
  status: "idle",
  activeClientId: null,
  activeProjectId: null,
  startedAt: null,
  promptDeadline: null,
  clients: [],
  projects: [],
};

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  mockedGetState.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("TrackerProvider retry backoff", () => {
  it("retries a failed initial load at 1s, 3s, 8s, holds at 8s, then succeeds", async () => {
    mockedGetState
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockRejectedValueOnce(new Error("fail 3"))
      .mockRejectedValueOnce(new Error("fail 4"))
      .mockResolvedValueOnce(snapshot);

    const { result } = renderHook(() => useTrackerLoadState(), { wrapper: TrackerProvider });

    await flush();
    expect(mockedGetState).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("error");

    await advance(1000);
    expect(mockedGetState).toHaveBeenCalledTimes(2);

    await advance(3000);
    expect(mockedGetState).toHaveBeenCalledTimes(3);

    await advance(8000);
    expect(mockedGetState).toHaveBeenCalledTimes(4);

    // a 4th consecutive failure holds at the last delay (8s) instead of growing further
    await advance(8000);
    expect(mockedGetState).toHaveBeenCalledTimes(5);
    expect(result.current.status).toBe("ready");
  });

  it("lets a manual retry() re-invoke getState immediately, bypassing the backoff timer", async () => {
    mockedGetState.mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce(snapshot);

    const { result } = renderHook(() => useTrackerLoadState(), { wrapper: TrackerProvider });

    await flush();
    const errorState = result.current;
    if (errorState.status !== "error") throw new Error("expected error state");

    await act(async () => {
      errorState.retry();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockedGetState).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("ready");
  });
});
