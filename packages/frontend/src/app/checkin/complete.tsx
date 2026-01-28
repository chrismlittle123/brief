"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, MessageCircle, ExternalLink, Pencil, AlertCircle } from "lucide-react";

// Mock data for projects that Brief AI detected
const DETECTED_PROJECTS = [
  { name: "Finchly UI Library", confidence: "high", color: "bg-primary" },
  { name: "Brief App", confidence: "medium", color: "bg-secondary" },
];

const MOCK_REPORT = {
  weekOf: "January 27, 2026",
  status: "On Track",
  progress: 75,
  summary: "Created three new components for the Finchly UI library following established patterns. Built Spinner, ProgressStepper, and AudioWaveform components using cva for variants and proper TypeScript conventions.",
  thisWeek: [
    { text: "Built Spinner component with size variants", project: "Finchly UI Library" },
    { text: "Created ProgressStepper for multi-step flows", project: "Finchly UI Library" },
    { text: "Implemented AudioWaveform voice visualizer", project: "Finchly UI Library" },
    { text: "Added exports to feedback/index.ts", project: "Finchly UI Library" },
  ],
  blockers: [],
  nextWeek: [
    { text: "Integration testing for new components", project: "Finchly UI Library" },
    { text: "Documentation and usage examples", project: "Finchly UI Library" },
  ],
};

export function CompletePage({ responses }: { responses: Record<string, string> }) {
  const [showEditChat, setShowEditChat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <h1 className="font-cursive text-3xl text-foreground">Brief</h1>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            AI Generated
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Report Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Weekly Update</h2>
              <p className="text-muted-foreground">Week of {MOCK_REPORT.weekOf}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{MOCK_REPORT.progress}%</div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Detected Projects */}
        <div className="mb-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Projects detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {DETECTED_PROJECTS.map((project) => (
              <span
                key={project.name}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                  project.confidence === "high"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary/10 text-secondary"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${project.color}`} />
                {project.name}
              </span>
            ))}
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Pencil className="h-3 w-3" />
              Edit projects
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-xl border border-border bg-card p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-2">Summary</h3>
          <p className="text-muted-foreground leading-relaxed">{MOCK_REPORT.summary}</p>
        </div>

        {/* This Week */}
        <div className="rounded-xl border border-border bg-card p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-3">This Week</h3>
          <ul className="space-y-2.5">
            {MOCK_REPORT.thisWeek.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-foreground">{item.text}</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {item.project}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Blockers */}
        {MOCK_REPORT.blockers.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Blockers
            </h3>
            <ul className="space-y-2">
              {MOCK_REPORT.blockers.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-destructive">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-success/5 p-5 mb-4">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              No Blockers
            </h3>
            <p className="text-sm text-muted-foreground">Everything is moving smoothly</p>
          </div>
        )}

        {/* Next Week */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Next Week</h3>
          <ul className="space-y-2.5">
            {MOCK_REPORT.nextWeek.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-muted-foreground">{item.text}</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {item.project}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Edit with Brief AI */}
        {!showEditChat ? (
          <button
            onClick={() => setShowEditChat(true)}
            className="w-full rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors group"
          >
            <MessageCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
            <p className="font-medium text-foreground">Something not right?</p>
            <p className="text-sm text-muted-foreground">Talk to Brief to make corrections</p>
          </button>
        ) : (
          <div className="rounded-xl border border-primary bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Talk to Brief</span>
            </div>
            <textarea
              placeholder="e.g., 'The Spinner component was actually for the Brief app, not Finchly' or 'Add that I also fixed a bug in the auth flow'"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowEditChat(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <Sparkles className="h-4 w-4" />
                Update Report
              </button>
            </div>
          </div>
        )}

        {/* Save to Notion Button */}
        <div className="mt-8">
          <button
            onClick={() => {
              setIsSaving(true);
              setTimeout(() => {
                setIsSaving(false);
                setShowSavedPopup(true);
                setTimeout(() => setShowSavedPopup(false), 3000);
              }, 1500);
            }}
            disabled={isSaving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Saving to Notion...
              </>
            ) : (
              <>
                <ExternalLink className="h-5 w-5" />
                Save to Notion
              </>
            )}
          </button>
        </div>

        {/* Back to Home */}
        <div className="mt-4 flex justify-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Saved Popup */}
        {showSavedPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-2xl bg-card p-8 shadow-xl text-center animate-in fade-in zoom-in duration-200">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Saved to Notion!</h3>
              <p className="text-muted-foreground">Your weekly update has been saved successfully.</p>
              <button
                onClick={() => setShowSavedPopup(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4" />
                View in Notion
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
