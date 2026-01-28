"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, MicOff, Check } from "lucide-react";
import { CompletePage } from "./complete";

const QUESTIONS = [
  { id: "work_done", question: "What did you work on this week?", followUp: "Got it." },
  { id: "progress", question: "What's your progress percentage?", followUp: "Thanks." },
  { id: "on_track", question: "Are you on track for your deadline?", followUp: "Okay." },
  { id: "blockers", question: "Any blockers or challenges?", followUp: "Noted." },
  { id: "next_week", question: "What's planned for next week?", followUp: "Sounds good." },
  { id: "other", question: "Anything else to flag?", followUp: null },
];

// Mock responses for demo
const MOCK_RESPONSES: Record<string, string> = {
  work_done: "I worked on the authentication module this week. Got the OAuth flow working and connected it to our user database. Also did some code reviews and helped onboard the new developer.",
  progress: "About 75%",
  on_track: "Yeah, should be done by Friday assuming no surprises",
  blockers: "Still waiting on API credentials from the vendor. I escalated it on Monday but haven't heard back yet.",
  next_week: "Planning to finish integration testing, start on the documentation, and maybe begin the password reset flow if there's time",
  other: "Nope, that's it!",
};

export default function CheckinPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep) / QUESTIONS.length) * 100;

  const simulateResponse = () => {
    setIsListening(true);

    // Simulate listening for 2 seconds
    setTimeout(() => {
      setIsListening(false);
      const response = MOCK_RESPONSES[currentQuestion.id];
      setResponses(prev => ({ ...prev, [currentQuestion.id]: response }));

      // Move to next question after a brief pause
      setTimeout(() => {
        if (currentStep < QUESTIONS.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsComplete(true);
        }
      }, 1000);
    }, 2000);
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

          {/* Audio waveform visualization (mock) */}
          <div className="my-8 flex items-center justify-center gap-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening ? "bg-primary" : "bg-muted"
                }`}
                style={{
                  height: isListening
                    ? `${Math.random() * 32 + 16}px`
                    : "8px",
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>

          {/* Response display */}
          {responses[currentQuestion.id] && (
            <div className="mb-6 rounded-lg bg-muted/50 p-4 text-left">
              <p className="text-sm text-muted-foreground">Your response:</p>
              <p className="mt-1 text-foreground">{responses[currentQuestion.id]}</p>
            </div>
          )}

          {/* Mic button */}
          <button
            onClick={simulateResponse}
            disabled={isListening}
            className={`inline-flex h-16 w-16 items-center justify-center rounded-full transition-all ${
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>

          <p className="mt-4 text-sm text-muted-foreground">
            {isListening ? "Listening..." : "Click to speak"}
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

