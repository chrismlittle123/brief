import { SignIn } from "@clerk/nextjs";
import { BriefLogo } from "@/components/brief-logo";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mb-8">
        <BriefLogo className="h-20 w-auto" />
      </div>
      <SignIn />
    </main>
  );
}
