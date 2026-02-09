"use client";

import { Mic, MicOff } from "lucide-react";

interface RecordingViewProps {
  isRecording: boolean;
  isTranscribing: boolean;
  onToggle: () => void;
}

function WaveformBar({ index, isRecording, isTranscribing }: { index: number; isRecording: boolean; isTranscribing: boolean }) {
  const colorClass = isRecording ? "bg-primary" : isTranscribing ? "bg-secondary" : "bg-muted";
  const height = isRecording ? "28px" : isTranscribing ? "16px" : "8px";

  return (
    <div
      className={`w-1.5 rounded-full transition-all duration-150 ${colorClass}`}
      style={{
        height,
        animationDelay: isRecording ? `${index * 100}ms` : undefined,
        animation: isRecording ? "waveform 1s ease-in-out infinite alternate" : undefined,
      }}
    />
  );
}

export function RecordingView({ isRecording, isTranscribing, onToggle }: RecordingViewProps) {
  return (
    <div className="text-center">
      {/* Audio waveform visualization */}
      <div className="mb-6 flex items-center justify-center gap-1.5">
        {[...Array(9)].map((_, i) => (
          <WaveformBar key={i} index={i} isRecording={isRecording} isTranscribing={isTranscribing} />
        ))}
      </div>

      {/* Recording button */}
      <button
        onClick={onToggle}
        disabled={isTranscribing}
        className={`inline-flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 shadow-lg ${
          isRecording
            ? "bg-destructive text-destructive-foreground shadow-destructive/30"
            : isTranscribing
            ? "bg-secondary text-secondary-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20"
        }`}
        style={{ animation: isRecording ? "gentlePulse 1.5s ease-in-out infinite" : undefined }}
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
        Answer all 7 questions in one go. Take your time!
      </p>
    </div>
  );
}
