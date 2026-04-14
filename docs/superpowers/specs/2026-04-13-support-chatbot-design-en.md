# RistoAgent Support Chatbot — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a floating support chatbot to all public pages of RistoAgent, powered by a text knowledge base + product screenshots, with the ability to forward unanswered questions to info@ristoagent.com.

**Architecture:** React widget (`SupportChat.tsx`) mounted in `app/layout.tsx`, calling `/api/chat/support` (streaming). The API reads markdown files from `knowledge/` and includes selected screenshots as images in the Claude context. If the bot cannot answer, it offers email forwarding: saves to Supabase and sends via Resend.

**Tech Stack:** Next.js App Router, Anthropic SDK (claude-sonnet-4-6), Supabase, Resend, React streaming (ReadableStream)

---

## Knowledge Base (`knowledge/`)

### Files created manually (at implementation time):

| File | Content |
|------|---------|
| `knowledge/product.md` | What RistoAgent is, who it's for, how it works in 3 steps |
| `knowledge/pricing.md` | Plans: Starter €29/mo, Pro €49/mo, Flexible €39/mo — features and differences |
| `knowledge/onboarding.md` | How to set up the bot: VAT number, Telegram token, Google Calendar |
| `knowledge/faq.md` | Frequently asked questions: does it work on WhatsApp? do you need a technician? how long does setup take? etc. |
| `knowledge/screenshots/` | Relevant screenshots copied from `C:/Users/Admin/Pictures/Screenshots/` |

### Screenshot selection
At implementation time, review available screenshots and copy to `knowledge/screenshots/` those showing:
- The RistoAgent dashboard
- The onboarding flow (steps 1–5)
- The Telegram bot in action
- The upgrade/plans page
- The landing page

---

## API Route `/api/chat/support`

### Request
```ts
POST /api/chat/support
Content-Type: application/json

{
  message: string,          // current user message
  history: Array<{role: "user"|"assistant", content: string}>,  // max last 6 messages
  userEmail?: string        // passed from client if user is logged in
}
```

### Behavior
1. Reads all `.md` files from `knowledge/` and concatenates them into the system prompt
2. Loads images from `knowledge/screenshots/` as base64 (max 5 images, resized if >1MB)
3. Calls `anthropic.messages.stream()` with model `claude-sonnet-4-6`
4. Responds with streaming (Server-Sent Events)

### System prompt
```
You are the support assistant for RistoAgent, a service that creates automated Telegram bots for local Italian businesses.

Your job is to answer questions about: what RistoAgent is, how it works, plans and pricing, and how to configure it.

Tone: professional but warm, in Italian (unless the user writes in English).

If you cannot answer a question, say exactly:
"I don't have information on this. I can forward your message to our team — we'll respond within 24 hours."

Do not make up information. Do not answer questions outside your scope (e.g., recipes, coding, topics unrelated to RistoAgent).

[KNOWLEDGE BASE]
{markdown file contents}
```

### Streaming response
```ts
// Uses ReadableStream with TextEncoder
// Each chunk: `data: {"delta": "text"}\n\n`
// End of stream: `data: [DONE]\n\n`
```

### Limits
- Max 500 input tokens per user message
- Max 6 messages of history
- 30s timeout

---

## Email Forwarding

### Trigger
The frontend detects when the bot's response contains the sentinel phrase `"I don't have information on this"` and shows a **"Yes, send to the team →"** button.

### Flow
1. User clicks the button
2. If `userEmail` is present → proceeds; otherwise shows email input field
3. Frontend calls `POST /api/chat/support/forward` with `{ email, message, botReply }`
4. API:
   - Saves to Supabase table `support_requests(id, email, message, bot_reply, created_at)`
   - Sends email to `info@ristoagent.com` via Resend
5. Shows confirmation: *"Message sent! We'll reply within 24 hours."*

### Supabase table (SQL to run manually)
```sql
CREATE TABLE support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  message text NOT NULL,
  bot_reply text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
-- Service role only
CREATE POLICY "service_role_only" ON support_requests
  USING (false) WITH CHECK (false);
```

---

## Widget UI (`components/SupportChat.tsx`)

### Visual structure
- **Closed bubble:** 56px round button bottom-right, color `#0EA5E9`, icon 💬, z-index 9999
- **Open window:** 380×500px card, same site palette (background `#0f1610`, border `#1e2b20`)
  - Header: small logo + "RistoAgent Assistant" + close button ✕
  - Scrollable message area
  - Text input + send button
  - Automatic welcome message on open

### Welcome message
> "Hi! 👋 I'm the RistoAgent assistant. I can answer questions about how the service works, plans and pricing, and setup. How can I help you?"

### UI states
- `idle` → bubble visible
- `open` → window open, messages visible
- `loading` → typing indicator (3 animated dots, already in site CSS)
- `forwarding` → shows email input if needed + send button
- `sent` → green confirmation message

### Layout integration
```tsx
// app/layout.tsx — add before </body>
import SupportChat from "@/components/SupportChat";
// ...
<SupportChat />
```

The component is `"use client"` and uses `usePathname()` to avoid mounting on `/dashboard` (registered users don't need the pre-sales support bot).

---

## Dependency installation
```bash
npm install resend
```

Environment variable to add:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

---

## Testing
1. Open `http://localhost:3000` → bubble visible bottom-right
2. Click → window opens with welcome message
3. Ask "how much does the Pro plan cost?" → correct answer from knowledge base
4. Ask something unknown → bot offers forwarding → enter email → confirm send
5. Verify row in Supabase `support_requests` + email received at `info@ristoagent.com`
6. Verify that on `/dashboard` the bubble does NOT appear
