import type { ClerkClient } from "@clerk/backend";
import type { FastifyBaseLogger } from "fastify";

const EVENT_TITLE = "Brief - Weekly Update";
const EVENT_DESCRIPTION =
  "Time to fill in your weekly Brief update.\n\nOpen Brief: https://brief.progression-labs.ai/checkin";
const TIMEZONE = "Europe/London";
const SLOT_DURATION_MINUTES = 15;
const DEFAULT_HOUR_NO_MEETINGS = 12;
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 23;

export type CalendarResult = {
  scheduled: boolean;
  eventId?: string;
  startTime?: string;
  reason?: string;
};

export async function getGoogleAccessToken(
  userId: string,
  clerk: ClerkClient
): Promise<string | null> {
  const tokenResponse = await clerk.users.getUserOauthAccessToken(
    userId,
    "google"
  );

  if (!tokenResponse.data || tokenResponse.data.length === 0) {
    return null;
  }

  return tokenResponse.data[0].token;
}

/**
 * Get the upcoming Monday from the given date.
 * If today is Monday, returns today (so the cron running Monday morning
 * schedules for the same day). Otherwise returns the next Monday.
 */
export function getNextMonday(from: Date = new Date()): Date {
  const day = from.getDay(); // 0=Sun … 1=Mon … 6=Sat
  const daysUntilMonday = day === 0 ? 1 : day <= 1 ? 1 - day : 8 - day;
  if (daysUntilMonday === 0) return from; // today is Monday
  const monday = new Date(from);
  monday.setDate(from.getDate() + daysUntilMonday);
  return monday;
}

function toLondonDatetime(date: Date, hours: number, minutes: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${year}-${month}-${day}T${h}:${m}:00`;
}

function toRFC3339(date: Date, hours: number, minutes: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const probe = new Date(`${year}-${month}-${day}T12:00:00Z`);
  const londonTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "numeric",
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const offsetPart = londonTime.find((p) => p.type === "timeZoneName");
  const offsetMatch = offsetPart?.value?.match(/GMT([+-]\d+)?/);
  const offsetHours = offsetMatch?.[1] ? parseInt(offsetMatch[1], 10) : 0;

  const utcDate = new Date(
    Date.UTC(
      year,
      date.getMonth(),
      date.getDate(),
      hours - offsetHours,
      minutes
    )
  );
  return utcDate.toISOString();
}

type BusyInterval = {
  start: string;
  end: string;
};

function pickSlotStart(busyIntervals: BusyInterval[]): { hour: number; min: number } {
  if (busyIntervals.length === 0) {
    return { hour: DEFAULT_HOUR_NO_MEETINGS, min: 0 };
  }

  const latestEnd = busyIntervals.reduce((latest, interval) => {
    const end = new Date(interval.end).getTime();
    return end > latest ? end : latest;
  }, 0);

  const slotStart = new Date(latestEnd + SLOT_DURATION_MINUTES * 60 * 1000);

  const londonParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(slotStart);

  const hourPart = londonParts.find((p) => p.type === "hour");
  const minutePart = londonParts.find((p) => p.type === "minute");
  return {
    hour: parseInt(hourPart?.value ?? "0", 10),
    min: parseInt(minutePart?.value ?? "0", 10),
  };
}

async function fetchFreeBusy(
  accessToken: string,
  dayStart: string,
  dayEnd: string,
  log: FastifyBaseLogger
): Promise<BusyInterval[] | null> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: dayStart,
        timeMax: dayEnd,
        timeZone: TIMEZONE,
        items: [{ id: "primary" }],
      }),
    }
  );

  if (!response.ok) {
    log.error({ status: response.status }, "FreeBusy API error");
    return null;
  }

  const data = (await response.json()) as {
    calendars?: { primary?: { busy?: BusyInterval[] } };
  };
  return data.calendars?.primary?.busy ?? [];
}

async function findSlotAfterLastMeeting(
  accessToken: string,
  mondayDate: Date,
  log: FastifyBaseLogger
): Promise<{ start: string; end: string } | null> {
  const dayStart = toRFC3339(mondayDate, DAY_START_HOUR, 0);
  const dayEnd = toRFC3339(mondayDate, DAY_END_HOUR, 59);

  const busyIntervals = await fetchFreeBusy(accessToken, dayStart, dayEnd, log);
  if (!busyIntervals) return null;

  const { hour, min } = pickSlotStart(busyIntervals);

  const slotEndMinutes = hour * 60 + min + SLOT_DURATION_MINUTES;
  const slotEndHour = Math.floor(slotEndMinutes / 60);
  const slotEndMin = slotEndMinutes % 60;

  const start = toLondonDatetime(mondayDate, hour, min);
  const end = toLondonDatetime(mondayDate, slotEndHour, slotEndMin);

  return { start, end };
}

export async function hasExistingReminder(
  accessToken: string,
  mondayDate: Date,
  log: FastifyBaseLogger
): Promise<{ exists: boolean; eventId?: string; startTime?: string }> {
  const dayStart = toRFC3339(mondayDate, 0, 0);
  const dayEnd = toRFC3339(mondayDate, 23, 59);

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: dayStart,
        timeMax: dayEnd,
        timeZone: TIMEZONE,
        singleEvents: "true",
        q: EVENT_TITLE,
      }),
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    log.error({ status: response.status }, "Events list error");
    return { exists: false };
  }

  const data = (await response.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      start?: { dateTime?: string; date?: string };
    }>;
  };
  const existing = (data.items ?? []).find(
    (e) => e.summary === EVENT_TITLE
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

async function createReminderEvent(
  accessToken: string,
  slot: { start: string; end: string },
  log: FastifyBaseLogger
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
        start: { dateTime: slot.start, timeZone: TIMEZONE },
        end: { dateTime: slot.end, timeZone: TIMEZONE },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 0 }],
        },
      }),
    }
  );

  if (!response.ok) {
    log.error({ status: response.status }, "Create event error");
    return null;
  }

  const event = (await response.json()) as {
    id: string;
    start?: { dateTime?: string };
  };
  return {
    eventId: event.id,
    startTime: event.start?.dateTime ?? slot.start,
  };
}

export async function scheduleReminder(
  userId: string,
  clerk: ClerkClient,
  log: FastifyBaseLogger
): Promise<CalendarResult> {
  const accessToken = await getGoogleAccessToken(userId, clerk);
  if (!accessToken) {
    return { scheduled: false, reason: "no_google_token" };
  }

  const mondayDate = getNextMonday();

  const existing = await hasExistingReminder(accessToken, mondayDate, log);
  if (existing.exists) {
    return {
      scheduled: true,
      eventId: existing.eventId,
      startTime: existing.startTime,
    };
  }

  const slot = await findSlotAfterLastMeeting(accessToken, mondayDate, log);
  if (!slot) {
    return { scheduled: false, reason: "calendar_query_failed" };
  }

  const result = await createReminderEvent(accessToken, slot, log);
  if (!result) {
    return { scheduled: false, reason: "create_failed" };
  }

  return {
    scheduled: true,
    eventId: result.eventId,
    startTime: result.startTime,
  };
}
