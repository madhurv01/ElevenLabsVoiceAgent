# ElevenLabs Agent Setup — Step by Step

This is the most fiddly part of the whole project. ElevenLabs' tool builder
is a **field-by-field form**, not a place you paste raw JSON — so follow the
clicks below exactly.

Go to https://elevenlabs.io/app/conversational-ai → **Create an Agent**.

---

## 1. System Prompt

Open the **Agent** tab and paste this into the System Prompt box:

```
You are a helpful, friendly customer support voice agent for [COMPANY NAME].
You can look up order status, support tickets, account details, and payment
status, and you can create new support tickets. Always ask for the customer's
email to verify identity before sharing sensitive details. Keep responses short,
warm, and conversational — this is a voice call, not a chat window. Never invent
data; only state facts returned by your tools. If a tool returns an error or
"not found", say so plainly and offer to create a support ticket instead.

You can also make changes on the customer's behalf: cancelling their own order
(only possible before it ships), changing the priority of or closing their own
support ticket, and updating their phone number. Before calling any tool that
changes data, repeat back exactly what you're about to do and wait for the
customer to say yes — never make a change without explicit verbal confirmation.
If a write action fails (e.g. the order already shipped), explain why plainly.

If the customer asks for a dashboard, analytics, chart, graph, or visual
breakdown of their orders, payments, support tickets, or account, call the
show_dashboard client tool with the matching table name and the email you
already verified. Say something like "Here's your analytics" while it opens.
```

Pick any voice under **Voices**, leave the default LLM (Gemini 2.5 Flash
works fine).

---

## 2. Add the main backend tool (server tool)

Go to **Tools → Add tool → Webhook**.

- **Name**: `support_backend`
- **Description**: `Looks up and updates order status, ticket status, account details, verifies payments, creates tickets, and logs the call. Always pass tool_name and parameters. Before any write action (cancel_order, update_ticket, update_phone) always confirm the change with the customer out loud first.`
- **Method**: POST
- **URL**: `https://YOUR_RENDER_URL/api/elevenlabs/tool`

### Body parameters (built field by field, not pasted as JSON)

Add these as **top-level properties**:

| Identifier | Data type | Required | Description |
|---|---|---|---|
| `tool_name` | String | ✅ | One of: `get_order_status`, `get_ticket_status`, `get_account_details`, `verify_payment`, `create_ticket`, `cancel_order`, `update_ticket`, `update_phone`, `log_call` (add these as Enum Values) |
| `parameters` | Object | ✅ | Nested object, see below |

Inside `parameters`, add each of these as a **String** (or **Boolean** where noted), all optional, Value Type = **LLM Prompt**:

`order_number`, `ticket_number`, `email`, `subject`, `description`,
`priority` (add enum values `low`/`normal`/`high`/`urgent`), `close` (Boolean),
`phone`, `conversation_id`, `customer_email`, `intent`, `query_text`,
`response_text`, `resolved` (Boolean)

Leave **Wait for response** checked for this tool (the agent needs the JSON
data back to speak the answer).

### When to use which `tool_name` — put this guidance in the tool description or system prompt:

- "Where's my order" → `get_order_status` with `{order_number, email}`
- "What's my ticket status" → `get_ticket_status` with `{ticket_number, email}`
- "What's my account status" → `get_account_details` with `{email}`
- "Did my payment go through" → `verify_payment` with `{order_number, email}`
- "I want to file a complaint" → `create_ticket` with `{email, subject, description, priority}`
- "Cancel my order" (only works pre-shipment) → `cancel_order` with `{order_number, email}`
- "Change ticket priority" / "close this ticket" → `update_ticket` with `{ticket_number, email, priority?, close?}`
- "Update my phone number" → `update_phone` with `{email, phone}`
- At the end of every call → `log_call` (summarize intent + outcome)

---

## 3. Add the dashboard tool (client tool)

This one is different — it's a **Client Tool**, meaning it runs in the
customer's browser instead of hitting your backend. This is how a voice
command can actually open something on screen.

Go to **Tools → Add tool → Client tool**.

- **Name**: `show_dashboard`
- **Description**: `Opens a full-screen analytics dashboard in the customer's browser for a specific table. Only use this when the customer explicitly asks for a dashboard, analytics, chart, graph, or visual summary. Always include the email you already verified with the customer earlier in the call.`
- **Wait for response**: leave **unchecked** — the browser function doesn't
  return anything the agent needs to speak, it just opens the UI.

Add two parameters:
| Identifier | Data type | Required |
|---|---|---|
| `table` | String (Enum: `orders`, `payments`, `support_tickets`, `customers`) | ✅ |
| `email` | String | ✅ |

The actual browser-side handler for this tool lives in
`frontend/components/VoiceWidget.js` — nothing to configure there, it's
already wired up.

---

## 4. Add the post-call webhook (reliable call logging)

Don't rely on the agent remembering to call `log_call` — add this as a
safety net so every conversation gets logged automatically.

Go to your agent's **Settings** (not Tools) and find **Webhooks** /
**Post-call transcription**. Add:

- **URL**: `https://YOUR_RENDER_URL/api/elevenlabs/post-call-webhook`
- **Method**: POST
- Enable it for this agent.

---

## 5. Attach everything and publish

1. Make sure both `support_backend` and `show_dashboard` show up as attached
   tools on this agent (check the agent's Tools list, not just that you
   created them).
2. If you're testing in the Preview panel, make sure **Mock tools** is
   toggled **off** — otherwise you'll get fake responses instead of real
   backend calls.
3. Click **Publish** (top right). Nothing works on the live widget until
   you've published.
4. Copy the **Agent ID** — click the widget's embed snippet, or check the
   agent's URL — and paste it into `frontend/.env.local` /
   your Vercel env vars as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.

## 6. Lock it down (optional but recommended)

Under **Authentication → Allowlist**, add your production domain so the
widget can't be embedded and used from anywhere else.
