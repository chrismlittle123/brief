import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getGoogleAccessToken,
  getNextFriday,
  hasExistingReminder,
} from "@/lib/calendar";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const accessToken = await getGoogleAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json({ scheduled: false });
    }

    const fridayDate = getNextFriday();
    const existing = await hasExistingReminder(accessToken, fridayDate);

    return NextResponse.json({
      scheduled: existing.exists,
      eventId: existing.eventId,
      startTime: existing.startTime,
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return NextResponse.json(
      {
        error: "Failed to check calendar status",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
