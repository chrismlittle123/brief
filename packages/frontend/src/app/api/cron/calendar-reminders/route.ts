import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { scheduleReminder, CalendarResult } from "@/lib/calendar";

/**
 * Vercel Cron: runs every Friday at 06:00 UTC.
 * Iterates all Clerk users and schedules a "Brief - Weekly Update"
 * calendar event for each user who has a Google OAuth token.
 */
export async function GET() {
  try {
    const client = await clerkClient();
    const usersResponse = await client.users.getUserList({ limit: 100 });
    const users = usersResponse.data;

    const results: { userId: string; email: string; calendar: CalendarResult }[] = [];

    for (const user of users) {
      const email = user.emailAddresses[0]?.emailAddress ?? "unknown";
      try {
        const calendar = await scheduleReminder(user.id);
        results.push({ userId: user.id, email, calendar });
      } catch (error) {
        console.error(`Calendar scheduling failed for ${email}:`, error);
        results.push({
          userId: user.id,
          email,
          calendar: { scheduled: false, reason: "error" },
        });
      }
    }

    const scheduled = results.filter((r) => r.calendar.scheduled).length;
    const skipped = results.length - scheduled;

    console.log(
      `[cron/calendar-reminders] Processed ${results.length} users: ${scheduled} scheduled, ${skipped} skipped`
    );

    return NextResponse.json({
      success: true,
      processed: results.length,
      scheduled,
      skipped,
      results,
    });
  } catch (error) {
    console.error("Cron calendar-reminders error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
