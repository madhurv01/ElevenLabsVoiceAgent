# AI Customer Support Voice Agent
### ElevenLabs + Supabase + FastAPI + Next.js

Talk to it like a real support line: ask about an order, a ticket, a payment,
or your account — out loud — and get a real, live answer pulled from a
database. It can also make changes for you ("cancel my order", "close this
ticket") and pop open a live analytics dashboard when you ask for one.

**How it fits together:**
```
You (voice) → ElevenLabs Agent (understands you, decides what to do)
                 ↓ calls a fixed set of tools
              FastAPI backend (the only thing that talks to the database)
                 ↓
              Supabase (Postgres) — orders, tickets, payments, customers
```
The agent never sees a database connection or writes SQL. It can only call
a handful of named, validated functions — that's what keeps it safe.

```
ai-voice-support/
├── backend/                  FastAPI service
│   ├── app/
│   │   ├── main.py           All API routes (REST + ElevenLabs endpoints)
│   │   ├── services.py       Business logic — every DB read/write lives here
│   │   ├── db.py             Supabase client (service-role key)
│   │   └── models.py         Request schemas (Pydantic)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 Next.js app
│   ├── app/                  Pages (home + /dashboard)
│   ├── components/           Voice widget, Quick Lookup, Analytics Dashboard
│   └── .env.local.example
├── supabase/
│   └── schema.sql            Tables, indexes, security rules, sample data
└── elevenlabs-agent-config.md   Full agent setup — the fiddly part, done step by step
```

---

## What you need before starting

- A free [Supabase](https://supabase.com) account (the database)
- A free [ElevenLabs](https://elevenlabs.io) account (the voice agent)
- Python 3.11+ and Node.js 18+ installed locally
- A place to deploy the backend (this guide uses [Render](https://render.com), free tier)
- A place to deploy the frontend (this guide uses [Vercel](https://vercel.com), free tier)

---

## 1. Set up the database (Supabase)

1. Go to supabase.com → **New Project**. Pick a name, password, region.
2. Once it's ready, open **SQL Editor** → **New query** → paste the entire
   contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates every table plus two sample customers with orders, tickets,
   and payments so you can test immediately.
3. Go to **Project Settings → API** and copy two values:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role key** (⚠️ not the `anon` key) → this is `SUPABASE_SERVICE_ROLE_KEY`

The service_role key can read/write *everything*, bypassing all security
rules — it must only ever live in the backend's `.env` file. Never put it in
frontend code or paste it into the ElevenLabs dashboard.

## 2. Run the backend locally

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

copy .env.example .env         # Mac/Linux: cp .env.example .env
# open .env and paste in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY

uvicorn app.main:app --reload --port 8000
```

Check it worked: open http://localhost:8000 — you should see `{"status": "ok"}`.

Try a real lookup:
```bash
curl -X POST http://localhost:8000/api/order-status ^
  -H "Content-Type: application/json" ^
  -d "{\"order_number\": \"ORD-1001\", \"email\": \"madhur@example.com\"}"
```

## 3. Deploy the backend (so the voice agent can reach it)

ElevenLabs' agent runs in the cloud, so it needs a **public HTTPS URL** —
`localhost` only works while you're testing the frontend by itself.

On [render.com](https://render.com):
1. **New +** → **Web Service** → connect your GitHub repo.
2. **Root Directory**: `backend`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
   `ALLOWED_ORIGINS` (comma-separated list — add your frontend's URL here
   once you have it in step 5).
6. Deploy. You'll get a URL like `https://your-app.onrender.com`.

Note: Render's free tier sleeps after 15 minutes of inactivity, so the first
request after a while takes ~30-50 seconds to wake up. That's normal.

## 4. Set up the ElevenLabs agent

This is the fiddly part — follow **[elevenlabs-agent-config.md](elevenlabs-agent-config.md)**
step by step. It walks through the exact dashboard clicks (ElevenLabs' tool
builder is a field-by-field UI, not a place you paste raw JSON). At the end
you'll have an **Agent ID**.

## 5. Run the frontend

```bash
cd frontend
npm install

copy .env.local.example .env.local     # Mac/Linux: cp .env.local.example .env.local
# edit .env.local:
#   NEXT_PUBLIC_ELEVENLABS_AGENT_ID = <agent ID from step 4>
#   NEXT_PUBLIC_API_BASE_URL = http://localhost:8000  (or your Render URL)

npm run dev
```

Open http://localhost:3000. You'll see:
- A **voice widget** — tap the mic and talk to your agent
- A **Quick Lookup** panel to test order/ticket/account/payment queries without speaking
- A **Recent Voice Interactions** feed, pulled live from `call_logs`

## 6. Deploy the frontend

On [vercel.com](https://vercel.com): **Add New → Project** → import your repo
→ set **Root Directory** to `frontend` → add the same two env vars from
step 5 (pointing `NEXT_PUBLIC_API_BASE_URL` at your Render URL) → **Deploy**.

Once you have the Vercel URL, go back to Render and add it to
`ALLOWED_ORIGINS` so the backend accepts requests from it.

## 7. Try it end to end

Say (or type into Quick Lookup): *"Can you check the status of order
ORD-1001? My email is madhur@example.com."* — the agent should read back
shipped status and a tracking number, pulled live from Supabase.

Other things to try by voice:
- *"Cancel order ORD-1002 for asha@example.com"* (works only if the order
  hasn't shipped yet)
- *"Change ticket TCK-5002 to high priority"*
- *"Show me an analytics dashboard for my orders"* — opens a full-screen
  chart view of that customer's data

---

## What the agent can actually do

**Read (safe for anyone to ask):**
order status, ticket status, account details, payment verification.

**Write (scoped to the caller's own records only, confirmed out loud first):**
cancel an order (only before it ships), change ticket priority, close a
ticket, update phone number, file a new support ticket.

**Analytics dashboard:** on request, opens a full-screen view with charts for
orders, payments, tickets, or account overview — scoped to that customer.

## Security model

- The agent never sees a database connection string or writes SQL — it only
  knows a fixed set of named tools, each validated with Pydantic.
- The backend uses Supabase's **service_role** key server-side only; every
  table has Row Level Security enabled with no public policies, so a leaked
  frontend key can't read anything.
- Every read/write checks the caller's email against the record's owner
  before touching it.
- Write actions are limited to safe, reversible fields — never raw status
  overrides (e.g. a customer can't mark their own order "delivered").

## Extending this

- **Multilingual:** ElevenLabs supports multiple languages/voices per agent.
- **Sentiment-based escalation:** analyze `query_text` in `call_logs` and
  auto-raise ticket priority or trigger human handoff.
- **Human handoff:** ElevenLabs supports transferring a live call to a phone
  number — configure under the agent's "Call transfer" settings.
