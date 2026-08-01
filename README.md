# AI Customer Support Voice Agent
### ElevenLabs + Supabase + FastAPI + Next.js

A voice-first customer support system: customers speak naturally, the
ElevenLabs Conversational AI agent understands intent, calls a locked-down
backend, and answers with real Supabase data — read aloud.

```
ai-voice-support/
├── backend/            FastAPI service — the ONLY thing that talks to Supabase
│   ├── app/
│   │   ├── main.py     REST + ElevenLabs webhook endpoints
│   │   ├── services.py Business logic (order/ticket/account/payment lookups)
│   │   ├── db.py        Supabase client (service-role key)
│   │   └── models.py    Request/response schemas
│   ├── requirements.txt
│   └── .env.example
├── frontend/            Next.js dashboard + embedded voice widget
│   ├── app/
│   ├── components/
│   └── .env.local.example
├── supabase/
│   └── schema.sql       Tables, indexes, RLS, seed data
└── elevenlabs-agent-config.md   Copy-paste agent + tool config
```

---

## 1. Set up Supabase (5 min)

1. Go to https://supabase.com -> New Project. Pick a name, password, region.
2. Once created, open **SQL Editor** -> New query -> paste the entire
   contents of `supabase/schema.sql` -> **Run**.
   This creates all tables, indexes, RLS locks, and 2 seed customers with
   sample orders/tickets/payments so you can test immediately.
3. Go to **Project Settings -> API**. Copy:
   - `Project URL` -> you'll use this as `SUPABASE_URL`
   - `service_role` key (NOT the `anon` key) -> `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ The service_role key bypasses Row Level Security. It must only ever
   live in the backend `.env` file — never in frontend code or in the
   ElevenLabs dashboard.

## 2. Run the backend (5 min)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: paste SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

uvicorn app.main:app --reload --port 8000
```

Verify it's running: open http://localhost:8000 -> should return
`{"status": "ok", ...}`.

Test a real lookup:
```bash
curl -X POST http://localhost:8000/api/order-status \
  -H "Content-Type: application/json" \
  -d '{"order_number": "ORD-1001", "email": "madhur@example.com"}'
```

## 3. Deploy the backend so ElevenLabs can reach it

ElevenLabs' cloud agent needs a **public HTTPS URL** — localhost won't work
for the voice agent (it's fine for local frontend testing only).

Easiest options:
- **Railway** or **Render**: connect the `backend/` folder as a Python
  service, set the same env vars, deploy. You'll get a URL like
  `https://your-app.up.railway.app`.
- **Fly.io**: `fly launch` inside `backend/`, set secrets via `fly secrets set`.
- Any VPS with `uvicorn app.main:app --host 0.0.0.0 --port 8000` behind a
  reverse proxy (Caddy/Nginx) with HTTPS.

Once deployed, note the URL — you'll need it for the ElevenLabs tool config
and for `NEXT_PUBLIC_API_BASE_URL` in the frontend.

## 4. Set up the ElevenLabs agent (10 min)

Follow `elevenlabs-agent-config.md` step by step:
1. Create an agent at https://elevenlabs.io/app/conversational-ai
2. Paste the system prompt
3. Add the `support_backend` webhook tool pointing at
   `https://YOUR_DEPLOYED_BACKEND/api/elevenlabs/tool`
4. Choose a voice
5. Copy the **Agent ID**

## 5. Run the frontend (5 min)

```bash
cd frontend
npm install

cp .env.local.example .env.local
# edit .env.local:
#   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<agent id from step 4>
#   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  (or your deployed backend URL)

npm run dev
```

Open http://localhost:3000 — you'll see:
- A glass, radiant voice widget (tap the mic to talk to your agent)
- A **Quick Lookup** panel to test order/ticket/account/payment queries
  without using voice
- A **Recent Voice Interactions** feed pulling from `call_logs`

## 6. Try it end to end

Say (or type via Quick Lookup): *"Can you check the status of order
ORD-1001 for madhur@example.com?"* — the agent should respond with shipped
status and tracking info, pulled live from Supabase.

---

## Security model (already implemented)

- The voice agent **never** sees a database connection string or writes SQL.
- It only knows about 6 named tool functions (`get_order_status`, etc.) whose
  parameters are validated with Pydantic before touching the database.
- The backend uses the Supabase **service_role** key server-side only, with
  RLS enabled on every table (no public policies), so even a leaked `anon`
  key/frontend can't read data directly.
- Ownership checks: order/ticket lookups optionally verify the caller's email
  matches the record's owner before returning details.

## Extending this (per your original spec)

- **Multilingual:** ElevenLabs supports multiple languages/voices per agent —
  duplicate the agent per language or use its built-in language detection.
- **Appointment booking / CRM integration:** add a new service function +
  Supabase table (e.g. `appointments`), then a new `tool_name` branch in
  `elevenlabs_tool_router`.
- **Sentiment analysis:** log the transcript sentiment alongside `call_logs`
  (e.g. call OpenAI/Claude on `query_text` before logging).
- **Human handoff:** ElevenLabs supports transferring a live call to a phone
  number/SIP — configure under the agent's "Call transfer" settings, trigger
  it from the prompt when priority = "urgent" or the customer asks for a human.
