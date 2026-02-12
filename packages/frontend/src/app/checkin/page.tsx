"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mic } from "lucide-react";
import { CompletePage } from "./complete";
import { SessionView } from "./session-view";
import { QuestionGrid } from "./question-grid";
import { createSession, getSession, Report } from "@/lib/api";
import { BriefLogo } from "@/components/brief-logo";

type ViewState = "ready" | "connecting" | "active" | "processing" | "complete";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 60000;

function ReadyView({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center">
      <div className="mb-6 flex items-center justify-center gap-1.5">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-muted transition-all duration-150"
            style={{ height: "8px" }}
          />
        ))}
      </div>
      <button
        onClick={onStart}
        className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
      >
        <Mic className="h-8 w-8" />
      </button>
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Click to start your check-in session
      </p>
      <p className="mt-2 text-xs text-muted-foreground/70">
        Brief AI will ask you each question conversationally
      </p>
    </div>
  );
}

function SpinnerView({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
      <p className="text-sm font-medium text-foreground mb-2">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function useSessionPolling(
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

function useCheckinSession() {
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
    setViewState("processing");
    startPolling();
  }, [startPolling]);

  return { viewState, error, report, sessionToken, livekitUrl, handleStart, handleDisconnect };
}

export default function CheckinPage() {
  const s = useCheckinSession();

  if (s.viewState === "complete" && s.report) {
    return <CompletePage initialReport={s.report} />;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /><span className="text-sm">Exit</span>
          </Link>
          <BriefLogo className="h-12 w-auto" />
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">
        {(s.viewState === "ready" || s.viewState === "active") && <QuestionGrid />}
        <div className="rounded-2xl border border-border bg-card p-8">
          {s.viewState === "ready" && <ReadyView onStart={s.handleStart} />}
          {s.viewState === "connecting" && <SpinnerView title="Starting session..." />}
          {s.viewState === "active" && (
            <SessionView token={s.sessionToken} livekitUrl={s.livekitUrl} onDisconnect={s.handleDisconnect} />
          )}
          {s.viewState === "processing" && (
            <SpinnerView title="Generating your report..." subtitle="Brief AI is analyzing your conversation" />
          )}
          {s.error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{s.error}</div>
          )}
        </div>
      </div>
    </main>
  );
}
