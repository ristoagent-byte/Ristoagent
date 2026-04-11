# RistoAgent — Telegram Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace WhatsApp with a Telegram Bot, integrate Claude AI for automatic replies, Google Calendar for bookings, and build a complete dashboard with QR code download.

**Architecture:** Single Next.js app (App Router) deployed on Vercel. Telegram sends messages to a Next.js API route webhook, which calls Claude API (with tool use for bookings) and Google Calendar API, then replies via Telegram Bot API. All data stored in Supabase.

**Tech Stack:** Next.js 15, Supabase (Auth + DB), Claude API (`claude-sonnet-4-6`), Telegram Bot API, Google Calendar API, `qrcode` npm library, TypeScript.

---

## File Structure

```
.env.local                              NEW — all secrets
app/
  globals.css                           MODIFY — brand color #0EA5E9
  layout.tsx                            MODIFY — add Google font
  page.tsx                              MODIFY — update colors + Telegram refs
  auth/
    page.tsx                            NEW — login / register
  onboarding/
    page.tsx                            MODIFY — full rewrite, 5 steps
  dashboard/
    page.tsx                            NEW — 3-tab dashboard
  api/
    telegram/
      webhook/
        route.ts                        NEW — core AI message handler
    google/
      auth/
        route.ts                        NEW — initiate Google Calendar OAuth
      callback/
        route.ts                        NEW — handle OAuth callback, save tokens
    business/
      route.ts                          NEW — GET/POST/PUT business config
    qrcode/
      route.ts                          NEW — generate QR PNG for bot link
lib/
  supabase-server.ts                    NEW — server-side Supabase client
  supabase-browser.ts                   NEW — browser-side Supabase client
  telegram.ts                           NEW — Telegram Bot API helpers
  google-calendar.ts                    NEW — Google Calendar API helpers
  claude.ts                             NEW — Claude API + tool definitions
  qrcode.ts                             NEW — QR code PNG generation
types/
  index.ts                              NEW — shared TypeScript types
```

---

## Prerequisites (do these manually before starting tasks)

### A — Supabase project
1. Go to [supabase.com](https://supabase.com) → New project → name it `ristoagent`
2. Settings → API → copy `URL` and `anon key` and `service_role key`
3. Authentication → Providers → Enable **Google** (you'll need Google OAuth credentials below)

### B — Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → New project → `RistoAgent`
2. APIs & Services → Enable **Google Calendar API**
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application)
   - Authorized redirect URIs: `http://localhost:3000/api/google/callback` (dev) and `https://ristoagent.com/api/google/callback` (prod)
4. Copy **Client ID** and **Client Secret**
5. Same credentials → also add to Supabase Google provider (for sign-in auth)

### C — Anthropic API
1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → create new key
2. Copy the key (starts with `sk-ant-`)

---

## Task 1: Initialize Git and Environment

**Files:**
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git**

```bash
cd "C:/Users/Admin/OneDrive/RISTOAGENT"
git init
```

- [ ] **Step 2: Create .gitignore**

Create `.gitignore`:
```
node_modules/
.next/
.env.local
.env*.local
*.log
```

- [ ] **Step 3: Create .env.local**

Create `.env.local` with your actual values:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Google OAuth (for Google Calendar)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

# Telegram webhook secret (any random string, e.g. openssl rand -hex 32)
TELEGRAM_WEBHOOK_SECRET=your-random-secret-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Install dependencies**

```bash
npm install @anthropic-ai/sdk @supabase/ssr googleapis qrcode
npm install --save-dev @types/qrcode
```

- [ ] **Step 5: Initial commit**

```bash
git add .gitignore
git commit -m "chore: initialize git, add gitignore"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Create types/index.ts**

```typescript
// types/index.ts

export type BusinessType =
  | "Ristorante / Pizzeria"
  | "Bar / Caffetteria"
  | "Agriturismo"
  | "Parrucchiere / Barbiere"
  | "Centro Estetico / SPA"
  | "Palestra / Studio Fitness"
  | "Studio Medico / Dentista"
  | "Altro";

export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: BusinessType;
  services: string;
  opening_hours: string;
  telegram_bot_token: string | null;
  telegram_bot_username: string | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_calendar_id: string | null;
  plan: "starter" | "pro";
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  telegram_chat_id: string;
  customer_name: string;
  language: "it" | "en";
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  text: string;
  sender: "customer" | "ai";
  created_at: string;
}

export interface Booking {
  id: string;
  business_id: string;
  conversation_id: string;
  customer_name: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  party_size: number;
  google_event_id: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Supabase Database Schema

**Files:**
- No code files — run SQL in Supabase dashboard

- [ ] **Step 1: Open Supabase SQL editor**

Go to your Supabase project → SQL Editor → New query

- [ ] **Step 2: Run schema SQL**

```sql
-- Businesses table
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  services text not null default '',
  opening_hours text not null default '',
  telegram_bot_token text,
  telegram_bot_username text,
  google_access_token text,
  google_refresh_token text,
  google_calendar_id text,
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

-- Conversations table
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  telegram_chat_id text not null,
  customer_name text not null default '',
  language text not null default 'it',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(business_id, telegram_chat_id)
);

-- Messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  text text not null,
  sender text not null check (sender in ('customer', 'ai')),
  created_at timestamptz not null default now()
);

-- Bookings table
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  customer_name text not null,
  date date not null,
  time time not null,
  party_size integer not null default 1,
  google_event_id text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.businesses enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.bookings enable row level security;

-- RLS policies: owners can read/write their own data
create policy "Users manage own business" on public.businesses
  for all using (auth.uid() = user_id);

create policy "Users read own conversations" on public.conversations
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );

create policy "Users read own messages" on public.messages
  for all using (
    conversation_id in (
      select c.id from public.conversations c
      join public.businesses b on b.id = c.business_id
      where b.user_id = auth.uid()
    )
  );

create policy "Users read own bookings" on public.bookings
  for all using (
    business_id in (select id from public.businesses where user_id = auth.uid())
  );
```

- [ ] **Step 3: Verify tables created**

In Supabase → Table Editor, confirm all 4 tables appear: `businesses`, `conversations`, `messages`, `bookings`.

---

## Task 4: Supabase Client Helpers

**Files:**
- Create: `lib/supabase-server.ts`
- Create: `lib/supabase-browser.ts`

- [ ] **Step 1: Create lib/supabase-server.ts**

```typescript
// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

// Server-side client with service role (bypasses RLS) — use only in API routes
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Server-side client that respects RLS (for user-context reads)
export function createUserClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}
```

- [ ] **Step 2: Create lib/supabase-browser.ts**

```typescript
// lib/supabase-browser.ts
import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowser() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase-server.ts lib/supabase-browser.ts
git commit -m "feat: add Supabase client helpers"
```

---

## Task 5: Claude AI Helper

**Files:**
- Create: `lib/claude.ts`

- [ ] **Step 1: Create lib/claude.ts**

```typescript
// lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import type { Business, Message } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function buildSystemPrompt(business: Business, language: "it" | "en"): string {
  const langInstruction =
    language === "it"
      ? "Rispondi SEMPRE in italiano, con tono caldo e professionale."
      : "Always reply in English, with a warm and professional tone.";

  return `You are a virtual assistant for "${business.name}", a ${business.type} in Italy.

${langInstruction}

Business information:
- Services: ${business.services}
- Opening hours: ${business.opening_hours}

Your responsibilities:
- Answer questions about services, prices, and opening hours
- Manage bookings: collect date, time, party size, and customer name before booking
- Use the check_availability tool BEFORE confirming any booking
- Use the create_booking tool to finalize confirmed bookings
- Never invent information not listed above
- Keep replies concise and friendly
- If you don't know something, say so honestly`;
}

const tools: Anthropic.Tool[] = [
  {
    name: "check_availability",
    description:
      "Check if a date and time slot is available in the business calendar",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format",
        },
        time: {
          type: "string",
          description: "Time in HH:MM format (24h)",
        },
        duration_minutes: {
          type: "number",
          description: "Duration in minutes (default 60)",
        },
      },
      required: ["date", "time"],
    },
  },
  {
    name: "create_booking",
    description: "Create a confirmed booking in the business calendar",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        time: { type: "string", description: "Time in HH:MM format (24h)" },
        duration_minutes: { type: "number", description: "Duration in minutes (default 60)" },
        customer_name: { type: "string", description: "Customer full name" },
        party_size: { type: "number", description: "Number of people" },
        notes: { type: "string", description: "Optional notes" },
      },
      required: ["date", "time", "customer_name"],
    },
  },
];

export interface ChatResult {
  reply: string;
  toolCalls: Array<{
    name: string;
    input: Record<string, unknown>;
    result?: unknown;
  }>;
}

export async function chat(
  business: Business,
  history: Message[],
  newMessage: string,
  language: "it" | "en",
  toolHandler: (
    name: string,
    input: Record<string, unknown>
  ) => Promise<unknown>
): Promise<ChatResult> {
  const systemPrompt = buildSystemPrompt(business, language);

  // Build message history for Claude (last 20 messages to stay within context)
  const claudeMessages: Anthropic.MessageParam[] = history.slice(-20).map((m) => ({
    role: m.sender === "customer" ? "user" : "assistant",
    content: m.text,
  }));
  claudeMessages.push({ role: "user", content: newMessage });

  const toolCalls: ChatResult["toolCalls"] = [];
  let messages = claudeMessages;

  // Agentic loop: Claude may call tools multiple times
  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find((b) => b.type === "text");
      return {
        reply: textBlock?.type === "text" ? textBlock.text : "",
        toolCalls,
      };
    }

    if (response.stop_reason === "tool_use") {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use") {
          const input = block.input as Record<string, unknown>;
          const result = await toolHandler(block.name, input);
          toolCalls.push({ name: block.name, input, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }

      // Continue the loop with tool results
      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      continue;
    }

    // Unexpected stop reason
    break;
  }

  return { reply: "", toolCalls };
}

export function detectLanguage(text: string): "it" | "en" {
  // Simple heuristic: check for Italian common words
  const italianWords = /\b(ciao|grazie|buon|vorrei|sono|siete|avete|per|con|una|uno|della|del|che|non|ho|ha)\b/i;
  return italianWords.test(text) ? "it" : "en";
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add Claude AI helper with tool use"
```

---

## Task 6: Telegram Helper

**Files:**
- Create: `lib/telegram.ts`

- [ ] **Step 1: Create lib/telegram.ts**

```typescript
// lib/telegram.ts

const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendMessage(
  botToken: string,
  chatId: number | string,
  text: string
): Promise<void> {
  const url = `${TELEGRAM_API}${botToken}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

export async function setWebhook(
  botToken: string,
  webhookUrl: string,
  secret: string
): Promise<{ ok: boolean; description?: string }> {
  const url = `${TELEGRAM_API}${botToken}/setWebhook`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  });
  return res.json();
}

export async function getBotInfo(
  botToken: string
): Promise<{ ok: boolean; result?: { username: string; first_name: string } }> {
  const url = `${TELEGRAM_API}${botToken}/getMe`;
  const res = await fetch(url);
  return res.json();
}

export function verifyWebhookSecret(
  request: Request,
  expectedSecret: string
): boolean {
  const incoming = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  return incoming === expectedSecret;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/telegram.ts
git commit -m "feat: add Telegram Bot API helper"
```

---

## Task 7: Google Calendar Helper

**Files:**
- Create: `lib/google-calendar.ts`

- [ ] **Step 1: Create lib/google-calendar.ts**

```typescript
// lib/google-calendar.ts
import { google } from "googleapis";

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
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

  // Get the primary calendar ID
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const { data } = await calendar.calendarList.get({ calendarId: "primary" });

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    calendar_id: data.id ?? "primary",
  };
}

async function getAuthenticatedCalendar(
  accessToken: string,
  refreshToken: string
) {
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
): Promise<{ available: boolean; alternatives?: string[] }> {
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/google-calendar.ts
git commit -m "feat: add Google Calendar API helper"
```

---

## Task 8: QR Code Helper

**Files:**
- Create: `lib/qrcode.ts`

- [ ] **Step 1: Create lib/qrcode.ts**

```typescript
// lib/qrcode.ts
import QRCode from "qrcode";

export async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: {
      dark: "#0a0f0d",
      light: "#ffffff",
    },
  });
}

export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    width: 400,
    margin: 2,
    type: "png",
    color: {
      dark: "#0a0f0d",
      light: "#ffffff",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/qrcode.ts
git commit -m "feat: add QR code generation helper"
```

---

## Task 9: Google OAuth API Routes

**Files:**
- Create: `app/api/google/auth/route.ts`
- Create: `app/api/google/callback/route.ts`

- [ ] **Step 1: Create app/api/google/auth/route.ts**

```typescript
// app/api/google/auth/route.ts
import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
```

- [ ] **Step 2: Create app/api/google/callback/route.ts**

```typescript
// app/api/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const userId = searchParams.get("state"); // we pass user_id as state

  if (error || !code || !userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=3&error=google_denied`
    );
  }

  try {
    const { access_token, refresh_token, calendar_id } =
      await exchangeCodeForTokens(code);

    const supabase = createServerClient();
    await supabase
      .from("businesses")
      .update({
        google_access_token: access_token,
        google_refresh_token: refresh_token,
        google_calendar_id: calendar_id,
      })
      .eq("user_id", userId);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=4&google=connected`
    );
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?step=3&error=google_failed`
    );
  }
}
```

- [ ] **Step 3: Update getAuthUrl to pass userId as state**

In `lib/google-calendar.ts`, update `getAuthUrl` to accept a `userId` parameter:

```typescript
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
```

Update `app/api/google/auth/route.ts` to read userId from query param:

```typescript
// app/api/google/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  const url = getAuthUrl(userId);
  return NextResponse.redirect(url);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/google/ lib/google-calendar.ts
git commit -m "feat: add Google Calendar OAuth routes"
```

---

## Task 10: Business API Route

**Files:**
- Create: `app/api/business/route.ts`

- [ ] **Step 1: Create app/api/business/route.ts**

```typescript
// app/api/business/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { setWebhook, getBotInfo } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("businesses")
    .insert({ ...body, user_id: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = createServerClient();

  // If a Telegram token is being set, register the webhook and get bot info
  if (body.telegram_bot_token) {
    const botInfo = await getBotInfo(body.telegram_bot_token);
    if (!botInfo.ok) {
      return NextResponse.json(
        { error: "Token Telegram non valido. Ricontrolla il token copiato da BotFather." },
        { status: 400 }
      );
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
    const webhookResult = await setWebhook(
      body.telegram_bot_token,
      webhookUrl,
      process.env.TELEGRAM_WEBHOOK_SECRET!
    );

    if (!webhookResult.ok) {
      return NextResponse.json(
        { error: "Impossibile registrare il webhook Telegram." },
        { status: 500 }
      );
    }

    body.telegram_bot_username = botInfo.result?.username;
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(body)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/business/route.ts
git commit -m "feat: add business CRUD API route with Telegram webhook registration"
```

---

## Task 11: QR Code API Route

**Files:**
- Create: `app/api/qrcode/route.ts`

- [ ] **Step 1: Create app/api/qrcode/route.ts**

```typescript
// app/api/qrcode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeBuffer } from "@/lib/qrcode";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const botUsername = searchParams.get("username");

  if (!botUsername) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const botUrl = `https://t.me/${botUsername}`;
  const buffer = await generateQRCodeBuffer(botUrl);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="ristoagent-qr-${botUsername}.png"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/qrcode/route.ts
git commit -m "feat: add QR code download API route"
```

---

## Task 12: Telegram Webhook Handler (Core AI Logic)

**Files:**
- Create: `app/api/telegram/webhook/route.ts`

- [ ] **Step 1: Create app/api/telegram/webhook/route.ts**

```typescript
// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSecret, sendMessage } from "@/lib/telegram";
import { createServerClient } from "@/lib/supabase-server";
import { chat, detectLanguage } from "@/lib/claude";
import {
  checkAvailability,
  createCalendarEvent,
} from "@/lib/google-calendar";
import type { TelegramUpdate, Business, Message } from "@/types";

export async function POST(request: NextRequest) {
  // 1. Verify the request is from Telegram
  if (!verifyWebhookSecret(request, process.env.TELEGRAM_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update: TelegramUpdate = await request.json();
  const message = update.message;

  if (!message?.text || !message.chat) {
    return NextResponse.json({ ok: true }); // ignore non-text updates
  }

  const chatId = message.chat.id;
  const customerName =
    [message.from?.first_name, message.from?.last_name]
      .filter(Boolean)
      .join(" ") || "Cliente";
  const incomingText = message.text;

  const supabase = createServerClient();

  // 2. Find business by matching the bot token via webhook URL
  // The bot token is embedded in the Telegram API URL, so we identify the business
  // by looking up which business has the bot token that matches this webhook call.
  // We use the X-Telegram-Bot-Api-Secret-Token header to find the right business.
  // Since all businesses share one webhook URL, we need to find who owns this chat.
  // Strategy: look up conversation first, then business.
  
  // Find existing conversation by chat_id
  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("*, businesses(*)")
    .eq("telegram_chat_id", chatId.toString())
    .single();

  let business: Business;
  let conversationId: string;

  if (existingConversation) {
    business = existingConversation.businesses as Business;
    conversationId = existingConversation.id;

    // Update last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);
  } else {
    // New conversation — but we can't know which business without more context
    // The bot token identifies the business. Telegram sends the bot token in the URL.
    // Since we use a single webhook for all bots via our API route, we need to
    // identify the business differently.
    // 
    // SOLUTION: Each business registers their own webhook URL with their bot.
    // The bot token is NOT exposed in the incoming webhook, but we stored it.
    // We match by checking which business bot received the message via Telegram's 
    // getUpdates — but since we use webhooks, we rely on the fact that Telegram 
    // sends the bot_id in the message's via_bot or we store mapping.
    //
    // PRACTICAL APPROACH for v1: Add bot_id to businesses table.
    // For now, find business by bot username stored in conversation or use a 
    // startup_message like /start that carries the bot info.
    
    // If message is /start, we can't identify the business yet.
    // We'll return a generic welcome and wait for more context.
    // In production: use separate webhook URLs per bot token.
    
    // For v1 with single-tenant (one business per deployment), 
    // just get the first active business:
    const { data: bizData } = await supabase
      .from("businesses")
      .select("*")
      .not("telegram_bot_token", "is", null)
      .limit(1)
      .single();

    if (!bizData) {
      return NextResponse.json({ ok: true });
    }

    business = bizData as Business;

    // Create new conversation
    const language = detectLanguage(incomingText);
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        business_id: business.id,
        telegram_chat_id: chatId.toString(),
        customer_name: customerName,
        language,
      })
      .select()
      .single();

    conversationId = newConv!.id;
  }

  // 3. Save incoming message
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    text: incomingText,
    sender: "customer",
  });

  // 4. Load conversation history (last 20 messages)
  const { data: history } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const messageHistory: Message[] = (history ?? []).slice(0, -1); // exclude current

  // 5. Detect language
  const language = detectLanguage(incomingText);

  // 6. Tool handler for Claude
  async function toolHandler(
    name: string,
    input: Record<string, unknown>
  ): Promise<unknown> {
    if (!business.google_access_token || !business.google_refresh_token || !business.google_calendar_id) {
      return { error: "Google Calendar not connected" };
    }

    if (name === "check_availability") {
      const result = await checkAvailability(
        business.google_access_token,
        business.google_refresh_token,
        business.google_calendar_id,
        input.date as string,
        input.time as string,
        (input.duration_minutes as number) ?? 60
      );
      return result;
    }

    if (name === "create_booking") {
      const event = await createCalendarEvent(
        business.google_access_token,
        business.google_refresh_token,
        business.google_calendar_id,
        {
          date: input.date as string,
          time: input.time as string,
          durationMinutes: (input.duration_minutes as number) ?? 60,
          customerName: input.customer_name as string,
          partySize: input.party_size as number | undefined,
          notes: input.notes as string | undefined,
        }
      );

      // Save booking to Supabase
      await supabase.from("bookings").insert({
        business_id: business.id,
        conversation_id: conversationId,
        customer_name: input.customer_name as string,
        date: input.date as string,
        time: input.time as string,
        party_size: (input.party_size as number) ?? 1,
        google_event_id: event.eventId,
        status: "confirmed",
      });

      return { success: true, eventId: event.eventId };
    }

    return { error: "Unknown tool" };
  }

  // 7. Call Claude
  const { reply } = await chat(
    business,
    messageHistory,
    incomingText,
    language,
    toolHandler
  );

  // 8. Send reply to Telegram
  if (reply && business.telegram_bot_token) {
    await sendMessage(business.telegram_bot_token, chatId, reply);
  }

  // 9. Save AI reply to Supabase
  if (reply) {
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      text: reply,
      sender: "ai",
    });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/telegram/webhook/route.ts
git commit -m "feat: add Telegram webhook handler with Claude AI and Google Calendar"
```

---

## Task 13: Auth Page

**Files:**
- Create: `app/auth/page.tsx`

- [ ] **Step 1: Create app/auth/page.tsx**

```tsx
// app/auth/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseBrowser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/onboarding");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/dashboard");
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #0f1f2e 0%, #0a0f0d 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "2rem 1rem",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e8f0e9",
    }}>
      <a href="/" style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0EA5E9",
        textDecoration: "none", marginBottom: "2rem", letterSpacing: "-0.02em" }}>
        RistoAgent
      </a>

      <div style={{
        background: "#0f1610", border: "1px solid #1e2b20", borderRadius: "1.2rem",
        padding: "2.5rem 2rem", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", marginBottom: "2rem", background: "#131a14",
          borderRadius: "0.8rem", padding: "4px" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "0.6rem", borderRadius: "0.6rem", border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 500,
              transition: "all 0.2s",
              background: mode === m ? "#0EA5E9" : "transparent",
              color: mode === m ? "#fff" : "#7a9b7e",
            }}>
              {m === "login" ? "Accedi" : "Registrati"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
            Email
          </label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
              border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
              fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
              marginBottom: "1rem", boxSizing: "border-box" }}
          />
          <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
            letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
              border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
              fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
              marginBottom: "1.5rem", boxSizing: "border-box" }}
          />

          {error && (
            <p style={{ color: "#ff6b6b", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
            border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
            fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, marginBottom: "1rem",
          }}>
            {loading ? "..." : mode === "login" ? "Accedi →" : "Crea account →"}
          </button>
        </form>

        <div style={{ textAlign: "center", color: "#7a9b7e", fontSize: "0.85rem",
          marginBottom: "1rem" }}>oppure</div>

        <button onClick={handleGoogleLogin} style={{
          width: "100%", padding: "0.85rem", background: "#131a14",
          border: "1px solid #1e2b20", borderRadius: "999px", color: "#e8f0e9",
          fontSize: "0.9rem", fontFamily: "inherit", cursor: "pointer",
        }}>
          🔐 Continua con Google
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/page.tsx
git commit -m "feat: add auth page (login/register/Google)"
```

---

## Task 14: Onboarding Wizard (5 Steps)

**Files:**
- Modify: `app/onboarding/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite app/onboarding/page.tsx**

```tsx
// app/onboarding/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { BusinessType } from "@/types";

const BUSINESS_TYPES: BusinessType[] = [
  "Ristorante / Pizzeria", "Bar / Caffetteria", "Agriturismo",
  "Parrucchiere / Barbiere", "Centro Estetico / SPA",
  "Palestra / Studio Fitness", "Studio Medico / Dentista", "Altro",
];

const STEPS = [
  { number: 1, label: "La tua attività" },
  { number: 2, label: "Servizi & Orari" },
  { number: 3, label: "Google Calendar" },
  { number: 4, label: "Bot Telegram" },
  { number: 5, label: "Attiva" },
];

type FormData = {
  businessName: string;
  businessType: string;
  services: string;
  openingHours: string;
  telegramToken: string;
};

export default function Onboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowser();

  const [step, setStep] = useState(Number(searchParams.get("step") ?? 1));
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    businessName: "", businessType: "", services: "", openingHours: "", telegramToken: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUserId(data.user.id);
    });

    if (searchParams.get("google") === "connected") setGoogleConnected(true);
    if (searchParams.get("error") === "google_denied") setError("Accesso Google negato. Riprova.");
  }, []);

  const update = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSaveStep1And2() {
    setLoading(true); setError("");
    const res = await fetch("/api/business", {
      method: businessId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId! },
      body: JSON.stringify({
        name: form.businessName,
        type: form.businessType,
        services: form.services,
        opening_hours: form.openingHours,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setBusinessId(data.id);
    setLoading(false);
    setStep(3);
  }

  async function handleConnectGoogle() {
    window.location.href = `/api/google/auth?userId=${userId}`;
  }

  async function handleSaveTelegramToken() {
    setLoading(true); setError("");
    const res = await fetch("/api/business", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId! },
      body: JSON.stringify({ telegram_bot_token: form.telegramToken }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setBotUsername(data.telegram_bot_username);

    // Generate QR code
    const qrRes = await fetch(`/api/qrcode?username=${data.telegram_bot_username}`);
    if (qrRes.ok) {
      const blob = await qrRes.blob();
      setQrDataUrl(URL.createObjectURL(blob));
    }

    setLoading(false);
    setStep(5);
  }

  function downloadQR() {
    if (!qrDataUrl || !botUsername) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `ristoagent-qr-${botUsername}.png`;
    a.click();
  }

  const progress = ((step - 1) / 4) * 100;

  const canProceed = () => {
    if (step === 1) return form.businessName.trim() && form.businessType;
    if (step === 2) return form.services.trim() && form.openingHours.trim();
    if (step === 3) return googleConnected;
    if (step === 4) return form.telegramToken.trim().length > 20;
    return true;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #0f1f2e 0%, #0a0f0d 60%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "2rem 1rem 4rem",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e8f0e9",
    }}>
      <a href="/" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0EA5E9",
        textDecoration: "none", marginBottom: "2.5rem" }}>RistoAgent</a>

      <div style={{
        background: "#0f1610", border: "1px solid #1e2b20", borderRadius: "1.4rem",
        padding: "2.5rem 2rem", width: "100%", maxWidth: "540px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        {/* Step indicators */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          {STEPS.map((s) => (
            <div key={s.number} style={{ display: "flex", flexDirection: "column",
              alignItems: "center", gap: "0.3rem", flex: 1,
              opacity: step >= s.number ? 1 : 0.35, transition: "opacity 0.3s" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step >= s.number ? "#0EA5E9" : "#1e2b20",
                border: `1px solid ${step >= s.number ? "#0EA5E9" : "#2a3e2c"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 500,
                color: step >= s.number ? "#fff" : "#7a9b7e",
              }}>
                {step > s.number ? "✓" : s.number}
              </div>
              <span style={{ fontSize: "0.6rem", textTransform: "uppercase",
                letterSpacing: "0.05em", color: "#7a9b7e", textAlign: "center" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: 3, background: "#1e2b20", borderRadius: 999,
          marginBottom: "2rem", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#0EA5E9",
            borderRadius: 999, width: `${progress}%`, transition: "width 0.4s ease" }} />
        </div>

        {error && (
          <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b",
            borderRadius: "0.6rem", padding: "0.75rem 1rem", marginBottom: "1rem",
            color: "#ff6b6b", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Raccontaci la tua attività
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
              Queste informazioni permettono all&apos;AI di rispondere correttamente ai tuoi clienti.
            </p>
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              Nome attività *
            </label>
            <input className="ob-input" placeholder="es. Trattoria da Mario"
              value={form.businessName} onChange={(e) => update("businessName", e.target.value)}
              autoFocus style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
                marginBottom: "1.2rem", boxSizing: "border-box" }} />
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              Tipo di attività *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {BUSINESS_TYPES.map((t) => (
                <button key={t} onClick={() => update("businessType", t)} style={{
                  padding: "0.6rem 0.8rem", background: form.businessType === t
                    ? "rgba(14,165,233,0.1)" : "#131a14",
                  border: `1px solid ${form.businessType === t ? "#0EA5E9" : "#1e2b20"}`,
                  borderRadius: "0.6rem", color: form.businessType === t ? "#0EA5E9" : "#7a9b7e",
                  fontSize: "0.8rem", fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                  transition: "all 0.2s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Servizi & Orari
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
              L&apos;AI userà queste informazioni per rispondere ai clienti in modo preciso.
            </p>
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              Servizi offerti *
            </label>
            <textarea
              placeholder={"es.\n- Taglio capelli uomo/donna €15\n- Colorazione €40\n- Barba €10"}
              value={form.services} onChange={(e) => update("services", e.target.value)} rows={5}
              style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.88rem", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                outline: "none", marginBottom: "1.2rem", boxSizing: "border-box" }} />
            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              Orari di apertura *
            </label>
            <textarea
              placeholder={"es.\nLun–Ven: 9:00–19:00\nSabato: 9:00–17:00\nDomenica: chiuso"}
              value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)}
              rows={4} style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.88rem", fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                outline: "none", boxSizing: "border-box" }} />
          </div>
        )}

        {/* STEP 3 — Google Calendar */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Collega Google Calendar
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.8rem" }}>
              RistoAgent userà il tuo calendario per verificare la disponibilità e creare
              prenotazioni automaticamente — senza che tu debba fare nulla.
            </p>

            {!googleConnected ? (
              <>
                <div style={{ background: "#131a14", border: "1px solid #1e2b20",
                  borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.85rem", color: "#7a9b7e", marginBottom: "0.5rem" }}>
                    ✅ Cosa succede dopo il click:
                  </p>
                  <ol style={{ paddingLeft: "1.2rem", color: "#e8f0e9", fontSize: "0.85rem",
                    lineHeight: 1.8 }}>
                    <li>Si apre Google per il login</li>
                    <li>Autorizzi RistoAgent ad accedere al calendario</li>
                    <li>Torni qui con il calendario collegato</li>
                  </ol>
                </div>
                <button onClick={handleConnectGoogle} style={{
                  width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
                  border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
                  fontFamily: "inherit", cursor: "pointer",
                }}>
                  🔗 Accedi con Google →
                </button>
              </>
            ) : (
              <div style={{ background: "rgba(14,165,233,0.1)", border: "1px solid #0EA5E9",
                borderRadius: "0.8rem", padding: "1.2rem", textAlign: "center" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>✅</p>
                <p style={{ fontWeight: 600, color: "#0EA5E9" }}>Google Calendar collegato!</p>
                <p style={{ fontSize: "0.82rem", color: "#7a9b7e", marginTop: "0.3rem" }}>
                  Il tuo calendario è pronto per gestire le prenotazioni.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Telegram */}
        {step === 4 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Crea il tuo Bot Telegram
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              Il bot è il canale tramite cui i tuoi clienti ti scriveranno. Crearlo è gratuito
              e richiede solo 2 minuti.
            </p>

            <div style={{ background: "#131a14", border: "1px solid #1e2b20",
              borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.8rem", color: "#0EA5E9", textTransform: "uppercase",
                letterSpacing: "0.07em", marginBottom: "1rem", fontWeight: 600 }}>
                Guida passo-passo
              </p>
              {[
                { n: 1, text: "Apri Telegram e cerca @BotFather" },
                { n: 2, text: 'Scrivi il comando: /newbot' },
                { n: 3, text: 'Scegli un nome per il bot (es. "Trattoria da Mario")' },
                { n: 4, text: 'Scegli uno username che finisce con "bot" (es. trattoria_mario_bot)' },
                { n: 5, text: "BotFather ti manda un token — copiaolo e incollalo qui sotto" },
              ].map((item) => (
                <div key={item.n} style={{ display: "flex", gap: "0.75rem",
                  alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <span style={{ minWidth: 22, height: 22, borderRadius: "50%",
                    background: "#0EA5E9", color: "#fff", fontSize: "0.7rem",
                    fontWeight: 700, display: "flex", alignItems: "center",
                    justifyContent: "center" }}>{item.n}</span>
                  <p style={{ fontSize: "0.85rem", color: "#e8f0e9", lineHeight: 1.5 }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase",
              letterSpacing: "0.07em", color: "#7a9b7e", marginBottom: "0.5rem" }}>
              Token BotFather *
            </label>
            <input
              placeholder="1234567890:AAFabcdefghijklmnopqrstuvwxyz"
              value={form.telegramToken}
              onChange={(e) => update("telegramToken", e.target.value)}
              style={{ width: "100%", padding: "0.75rem 1rem", background: "#131a14",
                border: "1px solid #1e2b20", borderRadius: "0.6rem", color: "#e8f0e9",
                fontSize: "0.88rem", fontFamily: "monospace", outline: "none",
                boxSizing: "border-box" }} />
            <p style={{ fontSize: "0.78rem", color: "#7a9b7e", marginTop: "0.5rem" }}>
              🔒 Il token è salvato in modo sicuro e non viene mai condiviso.
            </p>
          </div>
        )}

        {/* STEP 5 — Summary */}
        {step === 5 && (
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Tutto pronto! 🎉
            </h1>
            <p style={{ color: "#7a9b7e", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              RistoAgent è configurato. Scarica il QR code e condividilo ovunque.
            </p>

            <div style={{ background: "#131a14", border: "1px solid #1e2b20",
              borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em",
                color: "#0EA5E9", marginBottom: "0.8rem" }}>Riepilogo</p>
              {[
                { label: "Attività", value: form.businessName },
                { label: "Bot Telegram", value: botUsername ? `@${botUsername}` : "—" },
                { label: "Google Calendar", value: googleConnected ? "Collegato ✓" : "—" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between",
                  padding: "0.35rem 0", borderBottom: "1px solid #1e2b20",
                  fontSize: "0.85rem" }}>
                  <span style={{ color: "#7a9b7e" }}>{row.label}</span>
                  <strong style={{ color: "#e8f0e9", fontWeight: 400 }}>{row.value}</strong>
                </div>
              ))}
            </div>

            {qrDataUrl && (
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <img src={qrDataUrl} alt="QR Code" style={{ width: 160, height: 160,
                  borderRadius: "0.8rem", background: "#fff", padding: "0.5rem" }} />
                <p style={{ fontSize: "0.78rem", color: "#7a9b7e", margin: "0.5rem 0" }}>
                  Usa questo QR sui tuoi canali social, volantini e vetrina
                </p>
                <button onClick={downloadQR} style={{
                  padding: "0.5rem 1.2rem", background: "transparent",
                  border: "1px solid #0EA5E9", borderRadius: "999px",
                  color: "#0EA5E9", fontSize: "0.85rem", fontFamily: "inherit", cursor: "pointer",
                }}>
                  ⬇ Scarica QR Code PNG
                </button>
              </div>
            )}

            <button onClick={() => router.push("/dashboard")} style={{
              width: "100%", padding: "0.85rem", background: "#0EA5E9", color: "#fff",
              border: "none", borderRadius: "999px", fontSize: "0.95rem", fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
            }}>
              Vai alla Dashboard →
            </button>
          </div>
        )}

        {/* Actions */}
        {step < 5 && (
          <div style={{ display: "flex", gap: "0.8rem", marginTop: "2rem", alignItems: "center" }}>
            {step > 1 && (
              <button onClick={() => setStep((s) => s - 1)} style={{
                background: "transparent", border: "1px solid #1e2b20", borderRadius: "999px",
                color: "#7a9b7e", fontSize: "0.88rem", fontFamily: "inherit",
                padding: "0.75rem 1.2rem", cursor: "pointer",
              }}>
                ← Indietro
              </button>
            )}
            <button
              onClick={() => {
                if (step === 2) handleSaveStep1And2();
                else if (step === 4) handleSaveTelegramToken();
                else setStep((s) => s + 1);
              }}
              disabled={!canProceed() || loading}
              style={{
                flex: 1, background: "#0EA5E9", color: "#fff", border: "none",
                borderRadius: "999px", fontSize: "0.95rem", fontWeight: 500,
                fontFamily: "inherit", padding: "0.85rem 1.5rem", cursor: "pointer",
                opacity: !canProceed() || loading ? 0.35 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Salvataggio..." : step === 4 ? "Attiva bot →" : "Continua →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "feat: rewrite onboarding with 5 steps, Google Calendar, Telegram, QR code"
```

---

## Task 15: Dashboard (3 Tabs)

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Create app/dashboard/page.tsx**

```tsx
// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { Business, Booking, Conversation, Message } from "@/types";

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [activeTab, setActiveTab] = useState<"oggi" | "conversazioni" | "impostazioni">("oggi");
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [todayMsgCount, setTodayMsgCount] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUserId(data.user.id);
      loadData(data.user.id);
    });
  }, []);

  async function loadData(uid: string) {
    // Load business
    const { data: biz } = await supabase
      .from("businesses").select("*").eq("user_id", uid).single();
    if (!biz) { router.push("/onboarding"); return; }
    setBusiness(biz as Business);

    // Load today's bookings
    const today = new Date().toISOString().split("T")[0];
    const { data: bks } = await supabase
      .from("bookings").select("*").eq("business_id", biz.id).eq("date", today)
      .order("time", { ascending: true });
    setBookings((bks ?? []) as Booking[]);

    // Load conversations
    const { data: convs } = await supabase
      .from("conversations").select("*").eq("business_id", biz.id)
      .order("last_message_at", { ascending: false }).limit(20);
    setConversations((convs ?? []) as Conversation[]);

    // Count today's messages
    const { count } = await supabase.from("messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`);
    setTodayMsgCount(count ?? 0);

    // Generate QR if bot is connected
    if (biz.telegram_bot_username) {
      const res = await fetch(`/api/qrcode?username=${biz.telegram_bot_username}`);
      if (res.ok) {
        const blob = await res.blob();
        setQrDataUrl(URL.createObjectURL(blob));
      }
    }
  }

  async function loadConversationMessages(convId: string) {
    setSelectedConv(convId);
    const { data } = await supabase.from("messages").select("*")
      .eq("conversation_id", convId).order("created_at", { ascending: true });
    setConvMessages((data ?? []) as Message[]);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  function downloadQR() {
    if (!qrDataUrl || !business?.telegram_bot_username) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `ristoagent-qr-${business.telegram_bot_username}.png`;
    a.click();
  }

  const s: Record<string, React.CSSProperties> = {
    root: { minHeight: "100vh", background: "#0a0f0d",
      fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e9edef" },
    header: { padding: "16px 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", borderBottom: "1px solid #1a2620",
      background: "#0d1410" },
    logo: { fontSize: 20, fontWeight: 700, color: "#0EA5E9" },
    card: { background: "#111a15", borderRadius: 16, padding: 24,
      border: "1px solid #1a2620" },
    label: { fontSize: 11, color: "#8696a0", marginBottom: 4 },
    badge: { fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600 },
  };

  return (
    <div style={s.root}>
      <header style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={s.logo}>RistoAgent</span>
          {business && (
            <span style={{ fontSize: 13, color: "#8696a0" }}>— {business.name}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#0EA5E9" }}>● Attivo</span>
          <button onClick={handleSignOut} style={{ background: "transparent",
            border: "1px solid #1a2620", borderRadius: 8, color: "#8696a0",
            fontSize: 12, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
            Esci
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ padding: "16px 24px 0", borderBottom: "1px solid #1a2620",
        display: "flex", gap: 4 }}>
        {([
          { id: "oggi", label: "📅 Oggi" },
          { id: "conversazioni", label: "💬 Conversazioni" },
          { id: "impostazioni", label: "⚙️ Impostazioni" },
        ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "10px 20px", background: "transparent",
            border: "none", borderBottom: `2px solid ${activeTab === tab.id ? "#0EA5E9" : "transparent"}`,
            color: activeTab === tab.id ? "#0EA5E9" : "#8696a0",
            fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>

        {/* TAB: OGGI */}
        {activeTab === "oggi" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 14, marginBottom: 24 }}>
              {[
                { label: "Messaggi oggi", value: todayMsgCount.toString(), icon: "💬" },
                { label: "Prenotazioni oggi", value: bookings.length.toString(), icon: "📅" },
              ].map((m) => (
                <div key={m.label} style={s.card}>
                  <span style={{ fontSize: 24 }}>{m.icon}</span>
                  <p style={{ fontSize: 36, fontWeight: 700, marginTop: 8,
                    fontFamily: "monospace" }}>{m.value}</p>
                  <p style={{ fontSize: 13, color: "#8696a0", marginTop: 2 }}>{m.label}</p>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16,
                color: "#8696a0" }}>Prenotazioni di oggi</h3>
              {bookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#5a6a62" }}>
                  <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📭</p>
                  <p>Nessuna prenotazione per oggi.</p>
                  <p style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
                    Condividi il tuo QR code per iniziare a ricevere prenotazioni!
                  </p>
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "12px 0",
                    borderBottom: "1px solid #1a2620" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{b.customer_name}</p>
                      <p style={{ fontSize: 12, color: "#8696a0" }}>{b.party_size} persone</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{b.time.slice(0, 5)}</p>
                      <span style={{ ...s.badge, background: "rgba(14,165,233,0.1)",
                        color: "#0EA5E9" }}>{b.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB: CONVERSAZIONI */}
        {activeTab === "conversazioni" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedConv ? "1fr 1.5fr" : "1fr",
            gap: 16 }}>
            <div style={s.card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Conversazioni recenti
              </h3>
              {conversations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#5a6a62" }}>
                  <p>Nessuna conversazione ancora.</p>
                  <p style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
                    I clienti che scriveranno al bot appariranno qui.
                  </p>
                </div>
              ) : (
                conversations.map((c) => (
                  <div key={c.id} onClick={() => loadConversationMessages(c.id)}
                    style={{ padding: "12px 0", borderBottom: "1px solid #1a2620",
                      cursor: "pointer",
                      background: selectedConv === c.id ? "rgba(14,165,233,0.05)" : "transparent",
                      borderRadius: 8, paddingLeft: selectedConv === c.id ? 8 : 0,
                      transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{c.customer_name}</p>
                      <span style={{ ...s.badge,
                        background: c.language === "it" ? "rgba(14,165,233,0.1)" : "rgba(255,200,0,0.1)",
                        color: c.language === "it" ? "#0EA5E9" : "#ffc800" }}>
                        {c.language.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#5a6a62", marginTop: 2 }}>
                      {new Date(c.last_message_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                ))
              )}
            </div>

            {selectedConv && (
              <div style={{ ...s.card, display: "flex", flexDirection: "column" }}>
                <div style={{ overflowY: "auto", flex: 1, maxHeight: 500 }}>
                  {convMessages.map((m) => (
                    <div key={m.id} style={{ display: "flex",
                      justifyContent: m.sender === "customer" ? "flex-end" : "flex-start",
                      marginBottom: 8 }}>
                      <div style={{
                        maxWidth: "75%", padding: "10px 14px",
                        borderRadius: m.sender === "customer"
                          ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: m.sender === "customer" ? "#1a3a28" : "#1a2220",
                        border: `1px solid ${m.sender === "customer" ? "#254a38" : "#242e28"}`,
                      }}>
                        <p style={{ fontSize: 13, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                          {m.text}
                        </p>
                        <p style={{ fontSize: 10, color: "#5a6a62", textAlign: "right",
                          marginTop: 4 }}>
                          {new Date(m.created_at).toLocaleTimeString("it-IT", {
                            hour: "2-digit", minute: "2-digit" })}
                          {m.sender === "ai" && " · 🤖"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: IMPOSTAZIONI */}
        {activeTab === "impostazioni" && business && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={s.card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Bot Telegram
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>
                    {business.telegram_bot_username
                      ? `@${business.telegram_bot_username}` : "Non configurato"}
                  </p>
                  {business.telegram_bot_username && (
                    <a href={`https://t.me/${business.telegram_bot_username}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: "#0EA5E9" }}>
                      t.me/{business.telegram_bot_username} ↗
                    </a>
                  )}
                </div>
                {business.telegram_bot_username && (
                  <button onClick={() => navigator.clipboard.writeText(
                    `https://t.me/${business.telegram_bot_username}`
                  )} style={{ background: "transparent", border: "1px solid #1a2620",
                    borderRadius: 8, color: "#8696a0", fontSize: 12,
                    padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                    📋 Copia link
                  </button>
                )}
              </div>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div style={s.card}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#8696a0" }}>
                  QR Code
                </h3>
                <p style={{ fontSize: 12, color: "#5a6a62", marginBottom: 16 }}>
                  Scarica e usa su volantini, social, menu, vetrina — i clienti lo scansionano
                  e aprono direttamente il bot.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <img src={qrDataUrl} alt="QR Code"
                    style={{ width: 120, height: 120, borderRadius: 8,
                      background: "#fff", padding: 4 }} />
                  <button onClick={downloadQR} style={{
                    padding: "0.75rem 1.5rem", background: "#0EA5E9", color: "#fff",
                    border: "none", borderRadius: "999px", fontSize: "0.9rem",
                    fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  }}>
                    ⬇ Scarica PNG
                  </button>
                </div>
              </div>
            )}

            <div style={s.card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#8696a0" }}>
                Google Calendar
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "center" }}>
                <div>
                  <span style={{ ...s.badge,
                    background: business.google_access_token
                      ? "rgba(14,165,233,0.1)" : "rgba(255,107,107,0.1)",
                    color: business.google_access_token ? "#0EA5E9" : "#ff6b6b" }}>
                    {business.google_access_token ? "✓ Collegato" : "Non collegato"}
                  </span>
                </div>
                <a href={`/api/google/auth?userId=${userId}`} style={{
                  padding: "6px 16px", background: "transparent",
                  border: "1px solid #1a2620", borderRadius: 8, color: "#8696a0",
                  fontSize: 12, textDecoration: "none" }}>
                  {business.google_access_token ? "Ricollegare" : "Collega"}
                </a>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: "#8696a0" }}>
                Piano attivo
              </h3>
              <span style={{ ...s.badge,
                background: business.plan === "pro"
                  ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.05)",
                color: business.plan === "pro" ? "#0EA5E9" : "#8696a0",
                fontSize: 13, padding: "6px 14px" }}>
                {business.plan === "pro" ? "⭐ Pro" : "Starter (gratuito)"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add dashboard with Oggi/Conversazioni/Impostazioni tabs and QR download"
```

---

## Task 16: Update Landing Page (Colors + Telegram)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update globals.css brand color**

In `app/globals.css`, replace all occurrences of `#25d366` and `#25D366` with `#0EA5E9`, and `#128C7E` with `#0284C7`:

```bash
# In globals.css, find and replace:
# #25d366 → #0EA5E9
# #25D366 → #0EA5E9  
# #128C7E → #0284C7
# #a8ffb8 → #BAE6FD
```

- [ ] **Step 2: Update landing page copy**

In `app/page.tsx`, update the hero tag line and chat preview to reference Telegram instead of WhatsApp:

Find:
```tsx
<span className="hero-tag">
  <span className="hero-dot" />
  Powered by AI · WhatsApp Business
</span>
```

Replace with:
```tsx
<span className="hero-tag">
  <span className="hero-dot" />
  Powered by AI · Telegram Bot
</span>
```

Find:
```tsx
<p className="subheadline">
  RistoAgent gestisce prenotazioni, FAQ e conferme 24/7 —<br />
  così la tua attività non perde mai un cliente.
</p>
```

Replace with:
```tsx
<p className="subheadline">
  RistoAgent gestisce prenotazioni, FAQ e conferme 24/7 su Telegram —<br />
  così la tua attività non perde mai un cliente.
</p>
```

- [ ] **Step 3: Update nav CTA to point to /auth**

Find:
```tsx
<a href="/onboarding" className="nav-cta">
```
Replace with:
```tsx
<a href="/auth" className="nav-cta">
```

Do the same for all other `href="/onboarding"` links in the file — change them to `href="/auth"`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: update landing page for Telegram, new brand color #0EA5E9"
```

---

## Task 17: Test End-to-End

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000`

- [ ] **Step 2: Test auth flow**

1. Open `http://localhost:3000/auth`
2. Register with a test email and password
3. Verify redirect to `/onboarding`

- [ ] **Step 3: Test onboarding**

1. Complete Step 1 (business name + type)
2. Complete Step 2 (services + hours)
3. Step 3: click "Accedi con Google" — verify Google OAuth flow
4. Step 4: use a real BotFather token — verify webhook registration
5. Step 5: verify QR code appears and downloads correctly

- [ ] **Step 4: Test Telegram bot**

1. Open Telegram → find your bot by username
2. Send "ciao" → verify AI reply comes back in Italian
3. Send "I'd like to book a table" → verify AI reply in English
4. Send "Vorrei prenotare per 2 persone sabato alle 20" → verify calendar check and booking

- [ ] **Step 5: Test dashboard**

1. Open `http://localhost:3000/dashboard`
2. Tab "Oggi" → verify bookings appear
3. Tab "Conversazioni" → verify conversation and messages appear
4. Tab "Impostazioni" → verify QR download works

- [ ] **Step 6: Deploy to Vercel**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# (same as .env.local — add each variable manually)
# Then update GOOGLE_REDIRECT_URI to production URL
# And update NEXT_PUBLIC_APP_URL to production URL
```

After deploy, re-register the Telegram webhook with the production URL:
```
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://ristoagent.com/api/telegram/webhook&secret_token=<YOUR_SECRET>
```

---

## Self-Review Notes

- **Spec coverage:** All 5 onboarding steps ✓, Google Calendar OAuth ✓, Telegram webhook ✓, Claude AI with tool use ✓, QR code generation and download ✓, Dashboard 3 tabs ✓, Auth page ✓, IT/EN language detection ✓
- **Multi-tenant webhook:** The webhook handler uses a simplified single-business lookup for v1. In production with multiple customers, each business should register a unique webhook URL (e.g., `/api/telegram/webhook/<business_id>`). This is noted in the code and should be addressed before scaling.
- **Token refresh:** Google OAuth access tokens expire after 1 hour. The `googleapis` library handles refresh automatically when `refresh_token` is set — no extra logic needed.
- **Security:** Webhook secret verified on every Telegram request. Service role key only used server-side. Bot tokens stored in Supabase with RLS.
