"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Sparkles, MessageCircle, ExternalLink, AlertCircle, X, Loader2, Users } from "lucide-react";
import { generateReport, refineReport, saveToNotion, Report } from "@/lib/api";

function getWeekOf(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  return now.toLocaleDateString("en-US", options);
}

interface CompletePageProps {
  responses: Record<string, string>;
  initialReport?: Report;
}

export function CompletePage({ responses, initialReport }: CompletePageProps) {
  const [showEditChat, setShowEditChat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [report, setReport] = useState<Report | null>(initialReport || null);
  const [isGenerating, setIsGenerating] = useState(!initialReport);
  const [error, setError] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [notionUrl, setNotionUrl] = useState<string | null>(null);

  useEffect(() => {
    // Skip generation if we already have an initial report
    if (initialReport) return;

    async function generate() {
      try {
        const generated = await generateReport(responses);
        setReport(generated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate report");
      } finally {
        setIsGenerating(false);
      }
    }
    generate();
  }, [responses, initialReport]);

  if (isGenerating) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Generating your report...</h2>
          <p className="text-muted-foreground">Brief AI is analyzing your responses</p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">{error || "Failed to generate report"}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <h1 className="font-cursive text-5xl text-foreground">Brief</h1>
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
              <p className="text-muted-foreground">Week of {getWeekOf()}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              report.status === "On Track" ? "bg-success/10 text-success" :
              report.status === "At Risk" ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                report.status === "On Track" ? "bg-success" :
                report.status === "At Risk" ? "bg-secondary" : "bg-destructive"
              }`} />
              {report.status}
            </span>
          </div>
        </div>

        {/* TL;DR Card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-2">TL;DR</h3>
          <p className="text-foreground leading-relaxed">{report.tldr}</p>
        </div>

        {/* This Week */}
        {report.thisWeek.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <h3 className="font-semibold text-foreground mb-3">This Week</h3>
            <ul className="space-y-2.5">
              {report.thisWeek.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Challenges */}
        {report.challenges.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-secondary" />
              Challenges
            </h3>
            <ul className="space-y-2">
              {report.challenges.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <span className="text-secondary">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-success/5 p-5 mb-4">
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              No Challenges
            </h3>
            <p className="text-sm text-muted-foreground">Everything is moving smoothly</p>
          </div>
        )}

        {/* Next Week */}
        {report.nextWeek.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 mb-4">
            <h3 className="font-semibold text-foreground mb-3">Next Week</h3>
            <ul className="space-y-2.5">
              {report.nextWeek.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Client Pulse */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Client Pulse
          </h3>
          <p className="text-muted-foreground">{report.clientPulse}</p>
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
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="e.g., 'Add that I also fixed a bug in the auth flow' or 'Change the progress to 80%'"
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px] resize-none"
              disabled={isRefining}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowEditChat(false);
                  setEditInstruction("");
                }}
                disabled={isRefining}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!report || !editInstruction.trim()) return;
                  setIsRefining(true);
                  try {
                    const updatedReport = await refineReport(report, editInstruction);
                    setReport(updatedReport);
                    setShowEditChat(false);
                    setEditInstruction("");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to update report");
                  } finally {
                    setIsRefining(false);
                  }
                }}
                disabled={isRefining || !editInstruction.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Update Report
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Save to Notion Button */}
        <div className="mt-8">
          <button
            onClick={async () => {
              if (!report) return;
              setIsSaving(true);
              try {
                const result = await saveToNotion(report);
                setNotionUrl(result.url);
                setShowSavedPopup(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to save to Notion");
              } finally {
                setIsSaving(false);
              }
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
            <div className="relative rounded-2xl bg-card p-8 shadow-xl text-center animate-in fade-in zoom-in duration-200 max-w-sm mx-4">
              {/* Close button */}
              <button
                onClick={() => setShowSavedPopup(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Saved to Notion!</h3>
              <p className="text-muted-foreground">Your weekly update has been saved successfully.</p>
              <div className="mt-6">
                <a
                  href={notionUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ExternalLink className="h-4 w-4" />
                  View in Notion
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
