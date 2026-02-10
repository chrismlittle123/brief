"use client";

import { Check, AlertCircle, Users } from "lucide-react";
import { Report } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const colorClass =
    status === "ON_TRACK" ? "bg-success/10 text-success" :
    status === "AT_RISK" ? "bg-secondary/10 text-secondary" :
    "bg-destructive/10 text-destructive";
  const dotClass =
    status === "ON_TRACK" ? "bg-success" :
    status === "AT_RISK" ? "bg-secondary" :
    "bg-destructive";

  const displayLabel =
    status === "ON_TRACK" ? "On Track" :
    status === "AT_RISK" ? "At Risk" :
    "Blocked";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${colorClass}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {displayLabel}
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );
}

function TextSection({ title, text }: { title: string; text: string }) {
  return (
    <Section title={title}>
      <p className="text-muted-foreground">{text}</p>
    </Section>
  );
}

function ChallengesSection({ challenges }: { challenges: string[] }) {
  if (challenges.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-success/5 p-5 mb-4">
        <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />No Challenges
        </h3>
        <p className="text-sm text-muted-foreground">Everything is moving smoothly</p>
      </div>
    );
  }
  return (
    <Section title="Challenges" icon={<AlertCircle className="h-4 w-4 text-secondary" />}>
      <ul className="space-y-2">
        {challenges.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-muted-foreground">
            <span className="text-secondary">•</span>{item}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ReportHeader({ weekOf, status }: { weekOf: string; status: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Weekly Update</h2>
          <p className="text-muted-foreground">Week of {weekOf}</p>
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function ChecklistSection({ title, items, variant }: { title: string; items: string[]; variant: "done" | "upcoming" }) {
  if (items.length === 0) return null;
  return (
    <Section title={title}>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            {variant === "done"
              ? <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
              : <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0 mt-0.5" />}
            <span className={variant === "done" ? "text-foreground" : "text-muted-foreground"}>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ReportCard({ report, weekOf }: { report: Report; weekOf: string }) {
  return (
    <>
      <ReportHeader weekOf={weekOf} status={report.status} />
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-4">
        <h3 className="font-semibold text-foreground mb-2">TL;DR</h3>
        <p className="text-foreground leading-relaxed">{report.tldr}</p>
      </div>
      <ChecklistSection title="This Week" items={report.thisWeek} variant="done" />
      <ChallengesSection challenges={report.challenges} />
      <ChecklistSection title="Next Week" items={report.nextWeek} variant="upcoming" />
      {report.currentStatus && <TextSection title="Current Status" text={report.currentStatus} />}
      {report.dependencies && report.dependencies !== "None" && <TextSection title="Dependencies" text={report.dependencies} />}
      {report.supportRequired && report.supportRequired !== "None" && <TextSection title="Support Required" text={report.supportRequired} />}
      <Section title="Vibe Check" icon={<Users className="h-4 w-4 text-primary" />}>
        <p className="text-muted-foreground">{report.vibe}</p>
      </Section>
    </>
  );
}
