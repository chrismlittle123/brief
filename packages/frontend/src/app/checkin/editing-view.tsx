"use client";

import { Sparkles } from "lucide-react";

interface EditingViewProps {
  transcript: string;
  isGenerating: boolean;
  onTranscriptChange: (value: string) => void;
  onReRecord: () => void;
  onGenerate: () => void;
}

export function EditingView({ transcript, isGenerating, onTranscriptChange, onReRecord, onGenerate }: EditingViewProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Your transcript
      </label>
      <p className="text-xs text-muted-foreground mb-3">
        Review and edit if needed, then generate your report.
      </p>
      <textarea
        value={transcript}
        onChange={(e) => onTranscriptChange(e.target.value)}
        disabled={isGenerating}
        className="w-full h-48 px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        placeholder="Your transcribed response will appear here..."
      />

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onReRecord}
          disabled={isGenerating}
          className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Re-record
        </button>

        <button
          onClick={onGenerate}
          disabled={isGenerating || !transcript.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
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
  );
}
