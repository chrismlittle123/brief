"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Check, ChevronRight } from "lucide-react";
import { CompletePage } from "./complete";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio } from "@/lib/api";

const QUESTIONS = [
  { id: "work_done", question: "What did you work on this week?", followUp: "Got it." },
  { id: "progress", question: "What's your progress percentage?", followUp: "Thanks." },
  { id: "on_track", question: "Are you on track for your deadline?", followUp: "Okay." },
  { id: "blockers", question: "Any blockers or challenges?", followUp: "Noted." },
  { id: "next_week", question: "What's planned for next week?", followUp: "Sounds good." },
  { id: "other", question: "Anything else to flag?", followUp: null },
];

export default function CheckinPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const { isRecording, startRecording, stopRecording, error: recorderError } = useAudioRecorder();

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep) / QUESTIONS.length) * 100;
  const hasCurrentResponse = responses[currentQuestion?.id];

  const handleToggleRecording = useCallback(async () => {
    setTranscriptionError(null);

    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();
      if (audioBlob && audioBlob.size > 0) {
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          setResponses(prev => ({ ...prev, [currentQuestion.id]: text }));
          setTimeout(() => {
            setShowResponse(true);
          }, 100);
        } catch (err) {
          setTranscriptionError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setIsTranscribing(false);
        }
      }
    } else {
      // If there's already a response, fade it out first
      if (hasCurrentResponse && showResponse) {
        setIsExiting(true);
        setTimeout(() => {
          setShowResponse(false);
          setIsExiting(false);
          startRecording();
        }, 500);
      } else {
        startRecording();
      }
    }
  }, [isRecording, stopRecording, startRecording, currentQuestion?.id, hasCurrentResponse, showResponse]);

  // Handle spacebar to toggle recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !isTranscribing) {
        e.preventDefault();
        handleToggleRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleRecording, isTranscribing]);

  const goToNextQuestion = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowResponse(false);
      setIsExiting(false);
      if (currentStep < QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsComplete(true);
      }
    }, 400);
  };

  if (isComplete || !currentQuestion) {
    return <CompletePage responses={responses} />;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Exit</span>
            </Link>
            <span className="text-sm text-muted-foreground">
              Question {currentStep + 1} of {QUESTIONS.length}
            </span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Step indicators */}
        <div className="mb-8 flex justify-center gap-2">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i < currentStep
                  ? "bg-primary"
                  : i === currentStep
                  ? "bg-primary ring-4 ring-primary/20"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mb-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {currentStep + 1}
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">
            {currentQuestion.question}
          </h2>

          {/* Audio waveform visualization */}
          <div className={`my-8 flex items-center justify-center gap-1.5 transition-opacity duration-300 ${
            hasCurrentResponse && showResponse && !isRecording ? "opacity-30" : "opacity-100"
          }`}>
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ease-out ${
                  isRecording ? "bg-primary animate-pulse" : isTranscribing ? "bg-secondary" : "bg-muted"
                }`}
                style={{
                  height: isRecording
                    ? `${Math.sin((Date.now() / 200) + i) * 16 + 24}px`
                    : isTranscribing
                    ? "16px"
                    : "8px",
                  transitionDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>

          {/* Error display */}
          {(recorderError || transcriptionError) && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {recorderError || transcriptionError}
            </div>
          )}

          {/* Response display with beautiful entrance/exit */}
          {hasCurrentResponse && showResponse && (
            <div
              className={`mb-6 rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-500 ease-out ${
                isExiting
                  ? "opacity-0 translate-y-4 scale-95"
                  : "opacity-100 translate-y-0 scale-100"
              }`}
              style={{
                animation: !isExiting ? "responseEnter 0.6s ease-out" : undefined,
              }}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Your response</p>
              <p className="text-foreground leading-relaxed">{responses[currentQuestion.id]}</p>

              {/* Next question button */}
              <button
                onClick={goToNextQuestion}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {currentStep < QUESTIONS.length - 1 ? "Next question" : "Finish"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mic button */}
          <button
            onClick={handleToggleRecording}
            disabled={isTranscribing}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 shadow-sm ${
              isRecording
                ? "bg-destructive text-destructive-foreground shadow-destructive/25"
                : isTranscribing
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20"
            }`}
            style={{
              animation: isRecording ? "gentlePulse 1.5s ease-in-out infinite" : undefined,
            }}
          >
            <div className={`transition-all duration-300 ${isRecording ? "scale-90" : "scale-100"}`}>
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : isTranscribing ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </div>
          </button>

          <p className={`mt-3 text-xs font-medium transition-all duration-300 ${
            isRecording ? "text-destructive" : isTranscribing ? "text-secondary" : "text-muted-foreground"
          }`}>
            {isRecording
              ? "Tap to stop"
              : isTranscribing
              ? "Transcribing..."
              : hasCurrentResponse && showResponse
                ? "Re-record"
                : "Tap to speak"
            }
          </p>

          {/* Keyboard hint */}
          <p className="mt-2 text-[10px] text-muted-foreground/60">
            or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">space</kbd> to {isRecording ? "stop" : "start"}
          </p>
        </div>

        {/* Previous responses */}
        {Object.keys(responses).length > 0 && currentStep > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Previous responses</h3>
            <div className="space-y-3">
              {QUESTIONS.slice(0, currentStep).map((q, i) => (
                <div key={q.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-xs text-success-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {responses[q.id]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
