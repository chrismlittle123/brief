"use client";

import Link from "next/link";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { Mic, Clock, FileText, ArrowRight, PenLine, Calendar } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [calendarResult, setCalendarResult] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

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

        {/* Test Calendar Button */}
          {isSignedIn && (
            <div className="mt-6">
              <button
                onClick={async () => {
                  setIsScheduling(true);
                  setCalendarResult(null);
                  try {
                    const res = await fetch("/api/calendar/schedule-reminder", { method: "POST" });
                    const data = await res.json();
                    setCalendarResult(JSON.stringify(data, null, 2));
                  } catch (err) {
                    setCalendarResult(err instanceof Error ? err.message : "Failed");
                  } finally {
                    setIsScheduling(false);
                  }
                }}
                disabled={isScheduling}
                className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-xs font-mono text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                <Calendar className="h-3 w-3" />
                {isScheduling ? "Scheduling..." : "Test Calendar Event Creation"}
              </button>
              {calendarResult && (
                <pre className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground text-left max-w-md mx-auto overflow-auto">
                  {calendarResult}
                </pre>
              )}
            </div>
          )}

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
