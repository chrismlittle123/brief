"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompletePage } from "./complete";
import { RecordingView } from "./recording-view";
import { EditingView } from "./editing-view";
import { QuestionGrid } from "./question-grid";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { transcribeAudio, generateReport, Report } from "@/lib/api";
import { BriefLogo } from "@/components/brief-logo";

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
          setTranscript(await transcribeAudio(audioBlob));
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
    if (!transcript.trim()) { setError("Please record or enter your update first"); return; }
    setViewState("generating");
    setError(null);
    try {
      const generated = await generateReport({
        work_done: transcript, progress: "", on_track: "", blockers: "", next_week: "", other: "",
      });
      setReport(generated);
      setViewState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
      setViewState("editing");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || viewState !== "recording" || isTranscribing) return;
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      e.preventDefault();
      handleToggleRecording();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleRecording, viewState, isTranscribing]);

  if (viewState === "complete" && report) {
    return <CompletePage responses={{ transcript }} initialReport={report} />;
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
        <QuestionGrid />
        <div className="rounded-2xl border border-border bg-card p-8">
          {viewState === "recording" && (
            <RecordingView isRecording={isRecording} isTranscribing={isTranscribing} onToggle={handleToggleRecording} />
          )}
          {(viewState === "editing" || viewState === "generating") && (
            <EditingView
              transcript={transcript} isGenerating={viewState === "generating"}
              onTranscriptChange={setTranscript}
              onReRecord={() => { setViewState("recording"); setTranscript(""); }}
              onGenerate={handleGenerateReport}
            />
          )}
          {(error || recorderError) && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error || recorderError}</div>
          )}
        </div>
      </div>
    </main>
  );
}
