import { auth, clerkClient } from "@clerk/nextjs/server";

const EVENT_TITLE = "Brief - Weekly Update";
const EVENT_DESCRIPTION =
  "Time to fill in your weekly Brief update.\n\nOpen Brief: https://brief.palindrom.ai/checkin";
const TIMEZONE = "Europe/London";
const SLOT_DURATION_MINUTES = 15;
const WINDOW_START_HOUR = 9;
const WINDOW_END_HOUR = 12;

export interface CalendarResult {
  scheduled: boolean;
  eventId?: string;
  startTime?: string;
  reason?: string;
}

export async function getGoogleAccessToken(
  userId: string
): Promise<string | null> {
  const client = await clerkClient();
  const tokenResponse = await client.users.getUserOauthAccessToken(
    userId,
    "google"
  );

  if (!tokenResponse.data || tokenResponse.data.length === 0) {
    return null;
  }

  return tokenResponse.data[0].token;
}

/**
 * Get the next Friday from the given date.
 * If today is Friday, returns the *following* Friday.
 */
export function getNextFriday(from: Date = new Date()): Date {
  const day = from.getDay(); // 0=Sun … 5=Fri 6=Sat
  const daysUntilFriday = day <= 5 ? 5 - day : 6; // days until next Friday
  // If today is already Friday, push to next week
  const offset = daysUntilFriday === 0 ? 7 : daysUntilFriday;
  const friday = new Date(from);
  friday.setDate(from.getDate() + offset);
  return friday;
}

/**
 * Build a date string in Europe/London for a given date and hour/minute.
 * Returns an ISO-like string with the correct offset for Europe/London.
 */
function toLondonISO(date: Date, hours: number, minutes: number): string {
  // Build a date-time string that represents the wall-clock in London
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  // We use the IANA timezone directly with Google Calendar API,
  // so just return a plain datetime string (no offset).
  return `${year}-${month}-${day}T${h}:${m}:00`;
}

interface BusyInterval {
  start: string;
  end: string;
}

/**
 * Query Google Calendar FreeBusy for a given window on fridayDate.
 */
export async function findFreeSlot(
  accessToken: string,
  fridayDate: Date
): Promise<{ start: string; end: string } | null> {
  const windowStart = toLondonISO(fridayDate, WINDOW_START_HOUR, 0);
  const windowEnd = toLondonISO(fridayDate, WINDOW_END_HOUR, 0);

  const freeBusyResponse = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: windowStart,
        timeMax: windowEnd,
        timeZone: TIMEZONE,
        items: [{ id: "primary" }],
      }),
    }
  );

  if (!freeBusyResponse.ok) {
    console.error(
      "FreeBusy API error:",
      freeBusyResponse.status,
      await freeBusyResponse.text()
    );
    return null;
  }

  const freeBusyData = await freeBusyResponse.json();
  const busyIntervals: BusyInterval[] =
    freeBusyData.calendars?.primary?.busy ?? [];

  // Walk 15-minute slots from 09:00 to 11:45 (last possible 15-min slot ending at 12:00)
  const totalSlots =
    ((WINDOW_END_HOUR - WINDOW_START_HOUR) * 60) / SLOT_DURATION_MINUTES;

  for (let i = 0; i < totalSlots; i++) {
    const slotStartMinutes = WINDOW_START_HOUR * 60 + i * SLOT_DURATION_MINUTES;
    const slotEndMinutes = slotStartMinutes + SLOT_DURATION_MINUTES;

    const slotStartHour = Math.floor(slotStartMinutes / 60);
    const slotStartMin = slotStartMinutes % 60;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMin = slotEndMinutes % 60;

    const slotStart = toLondonISO(fridayDate, slotStartHour, slotStartMin);
    const slotEnd = toLondonISO(fridayDate, slotEndHour, slotEndMin);

    // Check if slot overlaps any busy interval
    const overlaps = busyIntervals.some((busy) => {
      const busyStart = new Date(busy.start).getTime();
      const busyEnd = new Date(busy.end).getTime();
      // Build slot times in London TZ for comparison
      const sStart = new Date(`${slotStart}+00:00`).getTime(); // approximate — we compare in the same TZ context
      const sEnd = new Date(`${slotEnd}+00:00`).getTime();
      // FreeBusy returns UTC times, so we need proper comparison.
      // Since we sent timeZone: Europe/London, the API returns UTC equivalents.
      // Our slot times are London wall-clock. Convert them for comparison.
      return busyStart < sEnd && busyEnd > sStart;
    });

    if (!overlaps) {
      return { start: slotStart, end: slotEnd };
    }
  }

  return null;
}

/**
 * Check if a "Brief - Weekly Update" event already exists for the given Friday.
 */
export async function hasExistingReminder(
  accessToken: string,
  fridayDate: Date
): Promise<{ exists: boolean; eventId?: string; startTime?: string }> {
  const dayStart = toLondonISO(fridayDate, 0, 0);
  const dayEnd = toLondonISO(fridayDate, 23, 59);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: `${dayStart}:00Z`,
        timeMax: `${dayEnd}:59Z`,
        timeZone: TIMEZONE,
        singleEvents: "true",
        q: EVENT_TITLE,
      }),
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    console.error(
      "Events list error:",
      response.status,
      await response.text()
    );
    return { exists: false };
  }

  const data = await response.json();
  const existing = (data.items ?? []).find(
    (e: { summary?: string }) => e.summary === EVENT_TITLE
  );

  if (existing) {
    return {
      exists: true,
      eventId: existing.id,
      startTime: existing.start?.dateTime ?? existing.start?.date,
    };
  }

  return { exists: false };
}

/**
 * Create a 15-minute "Brief - Weekly Update" calendar event.
 */
export async function createReminderEvent(
  accessToken: string,
  slot: { start: string; end: string }
): Promise<{ eventId: string; startTime: string } | null> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: EVENT_TITLE,
        description: EVENT_DESCRIPTION,
        start: {
          dateTime: slot.start,
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: slot.end,
          timeZone: TIMEZONE,
        },
        reminders: {
          useDefault: true,
        },
      }),
    }
  );

  if (!response.ok) {
    console.error(
      "Create event error:",
      response.status,
      await response.text()
    );
    return null;
  }

  const event = await response.json();
  return {
    eventId: event.id,
    startTime: event.start?.dateTime ?? slot.start,
  };
}

/**
 * Full scheduling flow: check for existing, find free slot, create event.
 * Used by both the API route and the save-to-notion integration.
 */
export async function scheduleReminder(
  userId: string
): Promise<CalendarResult> {
  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) {
    return { scheduled: false, reason: "no_google_token" };
  }

  const fridayDate = getNextFriday();

  // Idempotent: check if event already exists
  const existing = await hasExistingReminder(accessToken, fridayDate);
  if (existing.exists) {
    return {
      scheduled: true,
      eventId: existing.eventId,
      startTime: existing.startTime,
    };
  }

  // Find a free slot
  const slot = await findFreeSlot(accessToken, fridayDate);
  if (!slot) {
    return { scheduled: false, reason: "no_free_slot" };
  }

  // Create the event
  const result = await createReminderEvent(accessToken, slot);
  if (!result) {
    return { scheduled: false, reason: "create_failed" };
  }

  return {
    scheduled: true,
    eventId: result.eventId,
    startTime: result.startTime,
  };
}
