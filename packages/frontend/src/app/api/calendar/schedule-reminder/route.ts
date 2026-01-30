import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { scheduleReminder } from "@/lib/calendar";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await scheduleReminder(userId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Calendar scheduling error:", error);
    return NextResponse.json(
      {
        error: "Failed to schedule calendar reminder",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
