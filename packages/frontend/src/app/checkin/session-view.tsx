"use client";

import {
  LiveKitRoom,
  useVoiceAssistant,
  RoomAudioRenderer,
  DisconnectButton,
} from "@livekit/components-react";
interface SessionViewProps {
  token: string;
  livekitUrl: string;
  onDisconnect: () => void;
}

function AgentStatusBar({ index }: { index: number }) {
  return (
    <div
      className="w-1.5 rounded-full bg-primary transition-all duration-150"
      style={{
        height: "28px",
        animationDelay: `${index * 100}ms`,
        animation: "waveform 1s ease-in-out infinite alternate",
      }}
    />
  );
}

function IdleBar() {
  return <div className="w-1.5 rounded-full bg-muted h-2 transition-all duration-150" />;
}

function SessionControls() {
  const { state } = useVoiceAssistant();

  const isActive = state === "listening" || state === "speaking";
  const statusLabel =
    state === "connecting"
      ? "Connecting to agent..."
      : state === "initializing"
        ? "Agent joining..."
        : state === "listening"
          ? "Listening..."
          : state === "thinking"
            ? "Thinking..."
            : state === "speaking"
              ? "Agent speaking..."
              : "Connected";

  return (
    <div className="text-center">
      <div className="mb-6 flex items-center justify-center gap-1.5">
        {[...Array(9)].map((_, i) =>
          isActive ? <AgentStatusBar key={i} index={i} /> : <IdleBar key={i} />,
        )}
      </div>

      <p className="text-sm font-medium text-muted-foreground mb-6">{statusLabel}</p>

      <DisconnectButton
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-all hover:bg-destructive/90"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
          <line x1="23" y1="1" x2="1" y2="23" />
        </svg>
      </DisconnectButton>

      <p className="mt-4 text-xs text-muted-foreground/70">Click to end session</p>
    </div>
  );
}

export function SessionView({ token, livekitUrl, onDisconnect }: SessionViewProps) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      audio={true}
      onDisconnected={onDisconnect}
      style={{ display: "contents" }}
    >
      <RoomAudioRenderer />
      <SessionControls />
    </LiveKitRoom>
  );
}
