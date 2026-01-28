"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Sparkles } from "lucide-react";
import { CompletePage } from "./complete";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio, generateReport, Report } from "@/lib/api";

const QUESTIONS = [
  { id: "done", number: 1, question: "What did you get done this week?" },
  { id: "challenges", number: 2, question: "Any challenges? How did you handle them?" },
  { id: "next_week", number: 3, question: "What's the plan for next week?" },
  { id: "client_pulse", number: 4, question: "How's the client/stakeholder feeling?" },
];

type ViewState = "recording" | "editing" | "generating" | "complete";

export default function CheckinPage() {
  const [viewState, setViewState] = useState<ViewState>("recording");
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const { isRecording, startRecording, stopRecording, error: recorderError } = useAudioRecorder();

  const handleToggleRecording = useCallback(async () => {
    setError(null);

    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob && audioBlob.size > 0) {
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          setTranscript(text);
          setViewState("editing");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      startRecording();
    }
  }, [isRecording, stopRecording, startRecording]);

  const handleGenerateReport = async () => {
    if (!transcript.trim()) {
      setError("Please record or enter your update first");
      return;
    }

    setViewState("generating");
    setError(null);

    try {
      const generatedReport = await generateReport({
        work_done: transcript,
        progress: "",
        on_track: "",
        blockers: "",
        next_week: "",
        other: "",
      });
      setReport(generatedReport);
      setViewState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
      setViewState("editing");
    }
  };

  // Handle spacebar to toggle recording (only in recording view)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && viewState === "recording" && !isTranscribing) {
        // Don't trigger if user is typing in textarea
        if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
          return;
        }
        e.preventDefault();
        handleToggleRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleRecording, viewState, isTranscribing]);

  if (viewState === "complete" && report) {
    return <CompletePage responses={{ transcript }} initialReport={report} />;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Exit</span>
            </Link>
            <span className="text-sm text-muted-foreground">Voice Update</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Questions Reference */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Answer these questions in your recording:
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {q.number}
                </span>
                <p className="text-sm text-foreground">{q.question}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recording / Editing Area */}
        <div className="rounded-2xl border border-border bg-card p-8">
          {viewState === "recording" && (
            <div className="text-center">
              {/* Audio waveform visualization */}
              <div className="mb-6 flex items-center justify-center gap-1.5">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isRecording ? "bg-primary" : isTranscribing ? "bg-secondary" : "bg-muted"
                    }`}
                    style={{
                      height: isRecording
                        ? `${Math.sin((Date.now() / 150) + i * 0.8) * 20 + 28}px`
                        : isTranscribing
                        ? "16px"
                        : "8px",
                    }}
                  />
                ))}
              </div>

              {/* Recording button */}
              <button
                onClick={handleToggleRecording}
                disabled={isTranscribing}
                className={`inline-flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 shadow-lg ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground shadow-destructive/30"
                    : isTranscribing
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
                }`}
                style={{
                  animation: isRecording ? "gentlePulse 1.5s ease-in-out infinite" : undefined,
                }}
              >
                {isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : isTranscribing ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary-foreground border-t-transparent" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>

              <p className={`mt-4 text-sm font-medium ${
                isRecording ? "text-destructive" : isTranscribing ? "text-secondary" : "text-muted-foreground"
              }`}>
                {isRecording
                  ? "Recording... Click or press space to stop"
                  : isTranscribing
                  ? "Transcribing your audio..."
                  : "Click or press space to start recording"
                }
              </p>

              <p className="mt-2 text-xs text-muted-foreground/70">
                Answer all 6 questions in one go. Take your time!
              </p>
            </div>
          )}

          {(viewState === "editing" || viewState === "generating") && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your transcript
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Review and edit if needed, then generate your report.
              </p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={viewState === "generating"}
                className="w-full h-48 px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                placeholder="Your transcribed response will appear here..."
              />

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    setViewState("recording");
                    setTranscript("");
                  }}
                  disabled={viewState === "generating"}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Re-record
                </button>

                <button
                  onClick={handleGenerateReport}
                  disabled={viewState === "generating" || !transcript.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {viewState === "generating" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error display */}
          {(error || recorderError) && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error || recorderError}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
