"use client";

import { useState } from "react";
import { Calendar, Check, X, Loader2 } from "lucide-react";

export function CalendarTest() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSchedule = async () => {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/calendar/schedule-reminder", { method: "POST" });
      const data = await res.json();
      if (data.scheduled) {
        const time = data.startTime
          ? new Date(data.startTime).toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
            })
          : "";
        setMessage(time ? `Reminder scheduled for Friday at ${time}` : "Reminder already scheduled");
        setStatus("success");
      } else {
        setMessage(data.reason === "no_free_slot" ? "No free slot found between 08:00–12:00" : data.reason || "Could not schedule");
        setStatus("error");
      }
    } catch {
      setMessage("Failed to reach the server");
      setStatus("error");
    }
  };

  return (
    <div className="mt-12 mx-auto max-w-sm">
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <h4 className="font-semibold text-foreground text-sm">Test Calendar Reminder</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Schedule a Friday reminder event on your Google Calendar
        </p>
        <button
          onClick={handleSchedule}
          disabled={status === "loading"}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          {status === "loading" ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Scheduling...</>
          ) : (
            <><Calendar className="h-4 w-4" />Test Calendar Event Creation</>
          )}
        </button>
        {status === "success" && message && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success/10 px-4 py-2.5">
            <Check className="h-4 w-4 text-success shrink-0" />
            <span className="text-sm text-success">{message}</span>
          </div>
        )}
        {status === "error" && message && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5">
            <X className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-sm text-destructive">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
