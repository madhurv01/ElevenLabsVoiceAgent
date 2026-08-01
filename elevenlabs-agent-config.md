# ElevenLabs Agent Configuration

Create your agent at https://elevenlabs.io/app/conversational-ai, then configure it as below.

## 1. System Prompt (paste into "Agent" -> "Prompt")

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
```

## 2. Add ONE Server Tool (recommended — simplest to maintain)

Go to Tools -> Add Tool -> Webhook, and configure:

- **Name:** `support_backend`
- **Description:** `Looks up and updates order status, ticket status, account details, verifies payments, creates tickets, and logs the call. Always pass tool_name and parameters. Before any write action (cancel_order, update_ticket, update_phone) always confirm the change with the customer out loud first.`
- **Method:** POST
- **URL:** `https://elevenlabsvoiceagent.onrender.com/api/elevenlabs/tool`
- **Body schema:**

```json
{
  "tool_name": "string (one of: get_order_status, get_ticket_status, get_account_details, verify_payment, create_ticket, cancel_order, update_ticket, update_phone, log_call)",
  "parameters": {
    "order_number": "string, optional",
    "ticket_number": "string, optional",
    "email": "string, optional",
    "subject": "string, optional",
    "description": "string, optional",
    "priority": "string, optional (low/normal/high/urgent)",
    "close": "boolean, optional",
    "phone": "string, optional",
    "conversation_id": "string, optional",
    "customer_email": "string, optional",
    "intent": "string, optional",
    "query_text": "string, optional",
    "response_text": "string, optional",
    "resolved": "boolean, optional"
  }
}
```

Tell the LLM (in the tool description) which `tool_name` to use for which situation, e.g.:

- Customer asks "where is my order" -> `tool_name: get_order_status`, `parameters: {order_number, email}`
- Customer asks about a ticket -> `tool_name: get_ticket_status`
- Customer asks "what's my account status" -> `tool_name: get_account_details`
- Customer asks "did my payment go through" -> `tool_name: verify_payment`
- Customer wants to file a complaint -> `tool_name: create_ticket`
- Customer wants to cancel an order (only works if it hasn't shipped yet) ->
  `tool_name: cancel_order`, `parameters: {order_number, email}`
- Customer wants to change ticket priority or close a resolved ticket ->
  `tool_name: update_ticket`, `parameters: {ticket_number, email, priority?, close?}`
- Customer wants to update their phone number on file ->
  `tool_name: update_phone`, `parameters: {email, phone}`
- At the end of every call -> `tool_name: log_call` (summarize the intent + outcome)

⚠️ For any write action (`cancel_order`, `update_ticket`, `update_phone`), the
agent should always read back the change and get explicit verbal confirmation
from the customer BEFORE calling the tool — put this in the system prompt.

## 3. Alternative: separate tools per function

If you prefer explicit tools instead of one router, create 6 separate Webhook
tools pointing at:

- `POST /api/order-status` — body: `{order_number, email}`
- `POST /api/ticket-status` — body: `{ticket_number, email}`
- `POST /api/account-details` — body: `{email}`
- `POST /api/verify-payment` — body: `{order_number, email}`
- `POST /api/create-ticket` — body: `{email, subject, description, priority}`
- `POST /api/log-call` — body: `{conversation_id, customer_email, intent, query_text, response_text, resolved}`

This maps 1:1 to the REST endpoints in `backend/app/main.py` and is easier to
debug tool-by-tool, at the cost of more setup clicks.

## 4. Voice & Widget

- Pick any voice under Voice settings (e.g. "Rachel" or a custom clone).
- Under "Widget", copy your **Agent ID** — paste it into the frontend's
  `.env.local` as `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`.
- If your agent handles sensitive data, set Authentication -> Allowlist to your
  production domain to prevent the widget being embedded elsewhere.
