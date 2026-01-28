"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Clock, FileText, ArrowRight, PenLine, LogOut } from "lucide-react";

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email);
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserEmail(null);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="font-cursive text-5xl text-foreground">Brief</h1>
          {!isLoading && (
            <div className="flex items-center gap-4">
              {userEmail ? (
                <>
                  <span className="text-sm text-muted-foreground">{userEmail}</span>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
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

