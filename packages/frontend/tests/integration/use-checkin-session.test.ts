import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionPolling, useCheckinSession } from "@/hooks/use-checkin-session";
import type { Report } from "@/lib/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
}));

import { createSession, getSession } from "@/lib/api";

const mockCreateSession = vi.mocked(createSession);
const mockGetSession = vi.mocked(getSession);

const FAKE_REPORT: Report = {
  tldr: "Test report",
  thisWeek: ["Did stuff"],
  challenges: ["None"],
  currentStatus: "On track",
  nextWeek: ["More stuff"],
  dependencies: "None",
  supportRequired: "None",
  vibe: "Good",
  status: "ON_TRACK",
};

function pendingSession() {
  return {
    id: "sess-1",
    status: "processing",
    livekitRoom: "sess-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function completedSession() {
  return {
    id: "sess-1",
    status: "completed",
    livekitRoom: "sess-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    report: FAKE_REPORT,
  };
}

describe("useSessionPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls getSession and calls onComplete when status is completed", async () => {
    mockGetSession.mockResolvedValueOnce(pendingSession());
    mockGetSession.mockResolvedValueOnce(completedSession());

    const onComplete = vi.fn();
    const onError = vi.fn();

    renderHook(() => useSessionPolling("sess-1", onComplete, onError));

    // Manually start polling by re-rendering — we need to invoke startPolling
    const { result } = renderHook(() => useSessionPolling("sess-1", onComplete, onError));

    act(() => { result.current.startPolling(); });

    // First tick: pending
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();

    // Second tick: completed
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(mockGetSession).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledWith(FAKE_REPORT);
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError when getSession throws", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("Network error"));

    const onComplete = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useSessionPolling("sess-1", onComplete, onError));

    act(() => { result.current.startPolling(); });
    await act(async () => { vi.advanceTimersByTime(2000); });

    expect(onError).toHaveBeenCalledWith("Failed to retrieve report. Please try again.");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("does not leak intervals when startPolling is called multiple times", async () => {
    // Simulate the bug: multiple disconnect events calling startPolling
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    // Always return pending so intervals keep running
    mockGetSession.mockResolvedValue(pendingSession());

    const onComplete = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useSessionPolling("sess-1", onComplete, onError));

    // First call
    act(() => { result.current.startPolling(); });

    // Second call (simulating duplicate onDisconnected event)
    act(() => { result.current.startPolling(); });

    // Third call
    act(() => { result.current.startPolling(); });

    // The fix should clear previous intervals, so clearInterval should have
    // been called for each overwritten interval
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThanOrEqual(2);

    clearIntervalSpy.mockRestore();
  });

  it("stops polling after only one interval is active even with repeated startPolling calls", async () => {
    mockGetSession.mockResolvedValue(pendingSession());

    const onComplete = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useSessionPolling("sess-1", onComplete, onError));

    // Call startPolling 3 times (simulating 3 disconnect events)
    act(() => { result.current.startPolling(); });
    act(() => { result.current.startPolling(); });
    act(() => { result.current.startPolling(); });

    // Advance one tick
    await act(async () => { vi.advanceTimersByTime(2000); });

    // Should only have made ONE getSession call per tick, not 3
    // (if intervals leaked, there would be 3 calls)
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });
});

describe("useCheckinSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in ready state", () => {
    const { result } = renderHook(() => useCheckinSession());
    expect(result.current.viewState).toBe("ready");
    expect(result.current.error).toBeNull();
    expect(result.current.report).toBeNull();
  });

  it("transitions to active after successful createSession", async () => {
    mockCreateSession.mockResolvedValueOnce({
      sessionId: "sess-1",
      token: "tok-123",
      livekitUrl: "wss://test.livekit.cloud",
    });

    const { result } = renderHook(() => useCheckinSession());

    await act(async () => { await result.current.handleStart(); });

    expect(result.current.viewState).toBe("active");
    expect(result.current.sessionToken).toBe("tok-123");
    expect(result.current.livekitUrl).toBe("wss://test.livekit.cloud");
  });

  it("falls back to ready with error when createSession fails", async () => {
    mockCreateSession.mockRejectedValueOnce(new Error("Auth failed"));

    const { result } = renderHook(() => useCheckinSession());

    await act(async () => { await result.current.handleStart(); });

    expect(result.current.viewState).toBe("ready");
    expect(result.current.error).toBe("Auth failed");
  });

  it("ignores disconnect when not in active state (guards duplicate onDisconnected)", async () => {
    const { result } = renderHook(() => useCheckinSession());

    // Try to disconnect from "ready" state — should be a no-op
    act(() => { result.current.handleDisconnect(); });
    expect(result.current.viewState).toBe("ready");

    // Should never have called getSession
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("full flow: start → disconnect → poll → complete", async () => {
    mockCreateSession.mockResolvedValueOnce({
      sessionId: "sess-1",
      token: "tok-123",
      livekitUrl: "wss://test.livekit.cloud",
    });
    mockGetSession.mockResolvedValueOnce(pendingSession());
    mockGetSession.mockResolvedValueOnce(completedSession());

    const { result } = renderHook(() => useCheckinSession());

    // Start session
    await act(async () => { await result.current.handleStart(); });
    expect(result.current.viewState).toBe("active");

    // Disconnect
    act(() => { result.current.handleDisconnect(); });
    expect(result.current.viewState).toBe("processing");

    // First poll: still processing
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(result.current.viewState).toBe("processing");

    // Second poll: completed
    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(result.current.viewState).toBe("complete");
    expect(result.current.report).toEqual(FAKE_REPORT);
  });

  it("multiple disconnect calls don't create duplicate polling", async () => {
    mockCreateSession.mockResolvedValueOnce({
      sessionId: "sess-1",
      token: "tok-123",
      livekitUrl: "wss://test.livekit.cloud",
    });
    mockGetSession.mockResolvedValue(pendingSession());

    const { result } = renderHook(() => useCheckinSession());

    // Start session
    await act(async () => { await result.current.handleStart(); });

    // First disconnect: should work
    act(() => { result.current.handleDisconnect(); });
    expect(result.current.viewState).toBe("processing");

    // Second disconnect: should be ignored (viewState is now "processing", not "active")
    act(() => { result.current.handleDisconnect(); });

    // Advance timer
    await act(async () => { vi.advanceTimersByTime(2000); });

    // Should only poll once per tick (not multiple leaked intervals)
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });
});
