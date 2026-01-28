"use client";

import Link from "next/link";
import { Mic, Clock, FileText, ArrowRight, PenLine } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <h1 className="font-cursive text-4xl text-foreground">Brief</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Fill in the gaps.
          </h2>
          <p className="mt-2 font-cursive text-5xl text-primary md:text-6xl">
            Keep it brief.
          </p>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Share your update in minutes. AI writes a clean report and saves it to Notion — so you can get back to work.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/checkin"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              <Mic className="h-5 w-5" />
              Voice Update
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/checkin/text"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              <PenLine className="h-5 w-5" />
              Text Update
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Mic className="h-6 w-6" />}
            title="Voice-first"
            description="Just talk. No typing, no forms. Answer 6 quick questions."
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

      {/* Preview of questions */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h3 className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            What you&apos;ll be asked
          </h3>
          <div className="mt-8 space-y-3">
            {QUESTIONS.map((q, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-foreground">{q}</span>
              </div>
            ))}
          </div>
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

const QUESTIONS = [
  "What did you work on this week?",
  "What's your progress percentage?",
  "Are you on track for your deadline?",
  "Any blockers or challenges?",
  "What's planned for next week?",
  "Anything else to flag?",
];
