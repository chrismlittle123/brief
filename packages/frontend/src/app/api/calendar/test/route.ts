import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clerkClient();

    // Step 1: Get Google OAuth access token from Clerk
    const tokenResponse = await client.users.getUserOauthAccessToken(
      userId,
      "google"
    );

    if (!tokenResponse.data || tokenResponse.data.length === 0) {
      return NextResponse.json(
        {
          error: "No Google OAuth token found",
          hint: "Make sure the user signed in with Google and Calendar scopes are configured in Clerk",
        },
        { status: 400 }
      );
    }

    const accessToken = tokenResponse.data[0].token;
    const scopes = tokenResponse.data[0].scopes ?? [];

    // Step 2: Call Google Calendar API — list next 5 events
    const now = new Date().toISOString();
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=5&singleEvents=true&orderBy=startTime`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!calendarResponse.ok) {
      const errorBody = await calendarResponse.text();
      return NextResponse.json(
        {
          error: "Google Calendar API call failed",
          status: calendarResponse.status,
          scopes,
          body: errorBody,
        },
        { status: 502 }
      );
    }

    const calendarData = await calendarResponse.json();
    const events = (calendarData.items ?? []).map(
      (e: { summary?: string; start?: { dateTime?: string; date?: string } }) => ({
        summary: e.summary,
        start: e.start?.dateTime ?? e.start?.date,
      })
    );

    return NextResponse.json({
      success: true,
      userId,
      scopes,
      calendarEvents: events,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
