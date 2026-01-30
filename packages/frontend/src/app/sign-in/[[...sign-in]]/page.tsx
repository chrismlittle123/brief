import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="mb-8 font-cursive text-7xl text-foreground">Brief</h1>
      <SignIn />
    </main>
  );
}
