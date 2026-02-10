"use client";

import Link from "next/link";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { BriefLogo } from "@/components/brief-logo";
import { Mic, ArrowRight } from "lucide-react";
import { CalendarTest } from "./calendar-test";

function AuthButton({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) return <UserButton />;
  return (
    <SignInButton mode="redirect">
      <button className="text-sm text-primary hover:text-primary/80 transition-colors">Sign in</button>
    </SignInButton>
  );
}

function HeroSection({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-center">
        <h2 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">Fill in the gaps.</h2>
        <p className="mt-12 font-cursive text-6xl text-primary md:text-7xl">Keep it brief.</p>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Share your update in minutes. AI writes a clean report and saves it to Notion — so you can get back to work.
        </p>
        <div className="mt-10 flex justify-center">
          <Link href="/checkin" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium font-mono text-primary-foreground transition-colors hover:bg-primary/90">
            <Mic className="h-4 w-4" />Voice Update<ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      {isSignedIn && <CalendarTest />}
    </section>
  );
}

export default function HomePage() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <BriefLogo />
          {isLoaded && <div className="flex items-center gap-4"><AuthButton isSignedIn={!!isSignedIn} /></div>}
        </div>
      </header>
      <HeroSection isSignedIn={!!isSignedIn} />
    </main>
  );
}
