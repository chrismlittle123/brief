"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { CompletePage } from "../complete";

const QUESTIONS = [
  { id: "done", question: "What did you get done this week?", placeholder: "Describe your main accomplishments...", multiline: true },
  { id: "challenges", question: "Any challenges? How did you handle them?", placeholder: "What slowed you down and how you resolved it (or 'None')", multiline: true },
  { id: "current_status", question: "What are you currently working on and how far along are you?", placeholder: "e.g., 'Finishing the API integration, about 80% done'", multiline: true },
  { id: "next_week", question: "What's the plan for next week?", placeholder: "Your upcoming priorities...", multiline: true },
  { id: "dependencies", question: "Are you blocked on or waiting for anything?", placeholder: "e.g., 'Waiting on API keys from client' or 'None'", multiline: false },
  { id: "support", question: "Do you need any help or support from the team?", placeholder: "e.g., 'Need a code review on the auth PR' or 'None'", multiline: false },
  { id: "vibe", question: "How's the vibe? How are you and the client feeling?", placeholder: "e.g., 'All good, client is happy with progress'", multiline: false },
];

export default function TextCheckinPage() {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleChange = (id: string, value: string) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };

  const filledCount = Object.values(responses).filter(v => v.trim()).length;
  const canSubmit = responses.done?.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    // Simulate AI processing
    setTimeout(() => {
      setIsSubmitting(false);
      setIsComplete(true);
    }, 2000);
  };

  if (isComplete) {
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
            <h1 className="font-cursive text-5xl text-foreground">Brief</h1>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(filledCount / QUESTIONS.length) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Text Update</h2>
          <p className="mt-1 text-muted-foreground">
            Answer the questions below — AI will format your report
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {QUESTIONS.map((q, index) => (
            <div key={q.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  responses[q.id]?.trim()
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {responses[q.id]?.trim() ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <label className="font-medium text-foreground">{q.question}</label>
              </div>

              {q.multiline ? (
                <textarea
                  value={responses[q.id] || ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={responses[q.id] || ""}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filledCount} of {QUESTIONS.length} answered
          </span>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
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
    </main>
  );
}

