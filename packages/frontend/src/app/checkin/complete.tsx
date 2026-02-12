"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, MessageCircle, ExternalLink, AlertCircle, X, Loader2, Check } from "lucide-react";
import { refineReport, saveToNotion, Report } from "@/lib/api";
import { BriefLogo } from "@/components/brief-logo";
import { ReportCard } from "./report-card";

function getWeekOf(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
  return now.toLocaleDateString("en-US", options);
}

function ErrorView({ error }: { error: string }) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
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

function EditChat({ onUpdate, isRefining }: { onUpdate: (instruction: string) => void; isRefining: boolean }) {
  const [editInstruction, setEditInstruction] = useState("");

  return (
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
          onClick={() => onUpdate(editInstruction)}
          disabled={isRefining || !editInstruction.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isRefining ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Updating...</>
          ) : (
            <><Sparkles className="h-4 w-4" />Update Report</>
          )}
        </button>
      </div>
    </div>
  );
}

function SavedPopup({ notionUrl, onClose }: { notionUrl: string | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative rounded-2xl bg-card p-8 shadow-xl text-center animate-in fade-in zoom-in duration-200 max-w-sm mx-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Saved to Notion!</h3>
        <p className="text-muted-foreground">Your weekly update has been saved successfully.</p>
        <div className="mt-6">
          <a href={notionUrl || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <ExternalLink className="h-4 w-4" />
            View in Notion
          </a>
        </div>
      </div>
    </div>
  );
}

function EditToggle({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-xl border-2 border-dashed border-border p-4 text-center hover:border-primary hover:bg-primary/5 transition-colors group">
      <MessageCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
      <p className="font-medium text-foreground">Something not right?</p>
      <p className="text-sm text-muted-foreground">Talk to Brief to make corrections</p>
    </button>
  );
}

function SaveButton({ isSaving, onClick }: { isSaving: boolean; onClick: () => void }) {
  return (
    <div className="mt-8">
      <button onClick={onClick} disabled={isSaving} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
        {isSaving ? (
          <><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Saving to Notion...</>
        ) : (
          <><ExternalLink className="h-5 w-5" />Save to Notion</>
        )}
      </button>
    </div>
  );
}

type CompletePageProps = {
  initialReport: Report;
};

function useCompletePageState(initialReport: Report) {
  const [showEditChat, setShowEditChat] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [report, setReport] = useState<Report>(initialReport);
  const [error, setError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [notionUrl, setNotionUrl] = useState<string | null>(null);

  const handleRefine = async (instruction: string) => {
    if (!report) return;
    setIsRefining(true);
    try {
      setReport(await refineReport(report, instruction));
      setShowEditChat(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report");
    } finally {
      setIsRefining(false);
    }
  };

  const handleSave = async () => {
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
  };

  return { showEditChat, setShowEditChat, isSaving, showSavedPopup, setShowSavedPopup, report, error, isRefining, notionUrl, handleRefine, handleSave };
}

export function CompletePage({ initialReport }: CompletePageProps) {
  const state = useCompletePageState(initialReport);

  if (state.error) return <ErrorView error={state.error} />;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
          <BriefLogo className="h-12 w-auto" />
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />AI Generated
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <ReportCard report={state.report} weekOf={getWeekOf()} />
        {state.showEditChat
          ? <EditChat onUpdate={state.handleRefine} isRefining={state.isRefining} />
          : <EditToggle onClick={() => state.setShowEditChat(true)} />}
        <SaveButton isSaving={state.isSaving} onClick={state.handleSave} />
        <div className="mt-4 flex justify-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Back to Home</Link>
        </div>
        {state.showSavedPopup && <SavedPopup notionUrl={state.notionUrl} onClose={() => state.setShowSavedPopup(false)} />}
      </div>
    </main>
  );
}
