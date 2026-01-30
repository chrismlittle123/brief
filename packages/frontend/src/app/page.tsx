"use client";

import Link from "next/link";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { Mic, Clock, FileText, ArrowRight, PenLine, Calendar, Check, X, Loader2 } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [calendarStatus, setCalendarStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="font-cursive text-5xl text-foreground">Brief</h1>
          {isLoaded && (
            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <UserButton />
              ) : (
                <SignInButton mode="redirect">
                  <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Sign in
                  </button>
                </SignInButton>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Fill in the gaps.
          </h2>
          <p className="mt-6 font-cursive text-6xl text-primary md:text-7xl">
            Keep it brief.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Share your update in minutes. AI writes a clean report and saves it to Notion — so you can get back to work.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/checkin"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium font-mono text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <Mic className="h-4 w-4" />
              Voice Update
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/checkin/text"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium font-mono text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              <PenLine className="h-4 w-4" />
              Text Update
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Mic className="h-6 w-6" />}
            title="Voice-first"
            description="Just talk. No typing, no forms. Answer 4 quick questions."
          />
          <FeatureCard
            icon={<Clock className="h-6 w-6" />}
            title="5 minutes"
            description="Complete your weekly update in the time it takes to grab coffee."
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Auto-generated report"
            description="AI writes a clean summary and saves it directly to Notion."
          />
        </div>

        {/* Test Calendar */}
        {isSignedIn && (
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
                onClick={async () => {
                  setCalendarStatus("loading");
                  setCalendarMessage(null);
                  try {
                    const res = await fetch("/api/calendar/schedule-reminder", { method: "POST" });
                    const data = await res.json();
                    if (data.scheduled) {
                      const time = data.startTime
                        ? new Date(data.startTime).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/London",
                          })
                        : "";
                      setCalendarMessage(time ? `Reminder scheduled for Friday at ${time}` : "Reminder already scheduled");
                      setCalendarStatus("success");
                    } else {
                      setCalendarMessage(data.reason === "no_free_slot" ? "No free slot found between 08:00–12:00" : data.reason || "Could not schedule");
                      setCalendarStatus("error");
                    }
                  } catch {
                    setCalendarMessage("Failed to reach the server");
                    setCalendarStatus("error");
                  }
                }}
                disabled={calendarStatus === "loading"}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                {calendarStatus === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Test Calendar Event Creation
                  </>
                )}
              </button>
              {calendarStatus === "success" && calendarMessage && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-success/10 px-4 py-2.5">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span className="text-sm text-success">{calendarMessage}</span>
                </div>
              )}
              {calendarStatus === "error" && calendarMessage && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5">
                  <X className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-sm text-destructive">{calendarMessage}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h4 className="mt-4 font-semibold text-foreground">{title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
