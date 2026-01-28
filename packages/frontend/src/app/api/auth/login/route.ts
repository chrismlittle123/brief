import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Allowed emails - comma-separated list from env var
function getAllowedEmails(): string[] {
  const emailsEnv = process.env.ALLOWED_EMAILS || "";
  return emailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const allowedEmails = getAllowedEmails();

    // Check if email is in the allowed list
    if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
      return NextResponse.json(
        { error: "This email is not authorized. Contact your admin." },
        { status: 403 }
      );
    }

    // Set the auth cookie (7 days expiry)
    const cookieStore = await cookies();
    cookieStore.set("brief_user_email", normalizedEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true, email: normalizedEmail });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
