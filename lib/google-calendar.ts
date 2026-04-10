import { google } from "googleapis";

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

export function getAuthUrl(userId: string): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: userId,
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
  });
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ access_token: string; refresh_token: string; calendar_id: string }> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const { data } = await calendar.calendarList.get({ calendarId: "primary" });

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    calendar_id: data.id ?? "primary",
  };
}

async function getAuthenticatedCalendar(accessToken: string, refreshToken: string) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function checkAvailability(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  date: string,
  time: string,
  durationMinutes = 60
): Promise<{ available: boolean }> {
  const calendar = await getAuthenticatedCalendar(accessToken, refreshToken);

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDateTime.toISOString(),
      timeMax: endDateTime.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busy = data.calendars?.[calendarId]?.busy ?? [];
  return { available: busy.length === 0 };
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  calendarId: string,
  params: {
    date: string;
    time: string;
    durationMinutes?: number;
    customerName: string;
    partySize?: number;
    notes?: string;
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const calendar = await getAuthenticatedCalendar(accessToken, refreshToken);

  const durationMinutes = params.durationMinutes ?? 60;
  const startDateTime = new Date(`${params.date}T${params.time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

  const title = params.partySize
    ? `Prenotazione — ${params.customerName} (${params.partySize} pers.)`
    : `Prenotazione — ${params.customerName}`;

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: title,
      description: params.notes ?? "Prenotazione via RistoAgent",
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
    },
  });

  return { eventId: data.id!, htmlLink: data.htmlLink! };
}

export async function getTodayEvents(
  accessToken: string,
  refreshToken: string,
  calendarId: string
): Promise<Array<{ id: string; summary: string; start: string; end: string }>> {
  const calendar = await getAuthenticatedCalendar(accessToken, refreshToken);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const { data } = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (data.items ?? []).map((e) => ({
    id: e.id!,
    summary: e.summary ?? "",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    end: e.end?.dateTime ?? e.end?.date ?? "",
  }));
}
