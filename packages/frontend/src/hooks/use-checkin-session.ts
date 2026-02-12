import { useState, useCallback, useEffect, useRef } from "react";
import { createSession, getSession, Report } from "@/lib/api";

export type ViewState = "ready" | "connecting" | "active" | "processing" | "complete";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 60000;

export function useSessionPolling(
  sessionId: string,
  onComplete: (report: Report) => void,
  onError: (msg: string) => void,
) {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startPolling = useCallback(() => {
    // Guard: clear any existing interval before starting a new one
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    const startTime = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const session = await getSession(sessionId);
        if (session.status === "completed" && session.report) {
          stopPolling();
          onComplete(session.report);
        } else if (Date.now() - startTime > POLL_MAX_MS) {
          stopPolling();
          onError("Report generation timed out. Please try again.");
        }
      } catch {
        stopPolling();
        onError("Failed to retrieve report. Please try again.");
      }
    }, POLL_INTERVAL_MS);
  }, [sessionId, stopPolling, onComplete, onError]);

  return { startPolling };
}

export function useCheckinSession() {
  const [viewState, setViewState] = useState<ViewState>("ready");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [livekitUrl, setLivekitUrl] = useState("");
  const [sessionId, setSessionId] = useState("");

  const onPollComplete = useCallback((r: Report) => { setReport(r); setViewState("complete"); }, []);
  const onPollError = useCallback((msg: string) => { setError(msg); setViewState("ready"); }, []);
  const { startPolling } = useSessionPolling(sessionId, onPollComplete, onPollError);

  const handleStart = useCallback(async () => {
    setError(null);
    setViewState("connecting");
    try {
      const resp = await createSession({});
      setSessionId(resp.sessionId);
      setSessionToken(resp.token);
      setLivekitUrl(resp.livekitUrl);
      setViewState("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
      setViewState("ready");
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    // Guard: only start polling if we're in "active" state
    if (viewState !== "active") return;
    setViewState("processing");
    startPolling();
  }, [viewState, startPolling]);

  return { viewState, error, report, sessionToken, livekitUrl, handleStart, handleDisconnect };
}
