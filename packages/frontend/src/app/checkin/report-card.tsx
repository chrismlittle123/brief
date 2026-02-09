"use client";

import { Check, AlertCircle, Users } from "lucide-react";
import { Report } from "@/lib/api";

function StatusBadge({ status }: { status: string }) {
  const colorClass =
    status === "On Track" ? "bg-success/10 text-success" :
    status === "At Risk" ? "bg-secondary/10 text-secondary" :
    "bg-destructive/10 text-destructive";
  const dotClass =
    status === "On Track" ? "bg-success" :
    status === "At Risk" ? "bg-secondary" :
    "bg-destructive";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${colorClass}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {status}
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

export function ReportCard({ report, weekOf }: { report: Report; weekOf: string }) {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Weekly Update</h2>
            <p className="text-muted-foreground">Week of {weekOf}</p>
          </div>
          <StatusBadge status={report.status} />
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-4">
        <h3 className="font-semibold text-foreground mb-2">TL;DR</h3>
        <p className="text-foreground leading-relaxed">{report.tldr}</p>
      </div>

      {report.thisWeek.length > 0 && (
        <Section title="This Week">
          <ul className="space-y-2.5">
            {report.thisWeek.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <ChallengesSection challenges={report.challenges} />

      {report.nextWeek.length > 0 && (
        <Section title="Next Week">
          <ul className="space-y-2.5">
            {report.nextWeek.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-muted shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report.currentStatus && <TextSection title="Current Status" text={report.currentStatus} />}
      {report.dependencies && report.dependencies !== "None" && <TextSection title="Dependencies" text={report.dependencies} />}
      {report.supportRequired && report.supportRequired !== "None" && <TextSection title="Support Required" text={report.supportRequired} />}

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />Vibe Check
        </h3>
        <p className="text-muted-foreground">{report.vibe}</p>
      </div>
    </>
  );
}
