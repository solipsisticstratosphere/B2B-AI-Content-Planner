# ContentFlow AI

B2B SaaS MVP — AI-powered content planner for social media teams. Generate LinkedIn, Twitter/X, and Telegram posts with one click, schedule them in a drag-and-drop calendar, and track usage across your team.

> Portfolio demo under the fictional brand "ContentFlow AI". All data is synthetic.

---

## Features

- **AI generation** — streaming text generation via Groq (Llama 3.1), configurable platform & tone
- **Content calendar** — weekly drag-and-drop grid with mobile list view
- **Token usage** — free-tier limits with Stripe-powered upgrade flow
- **Generation history** — restore previous prompts and results
- **Auth** — email/password via Supabase Auth with protected routes

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| AI | Groq API (llama-3.1-8b-instant) via SSE streaming |
| Payments | Stripe Checkout + webhooks |
| Routing | React Router v7 |
| DnD | @dnd-kit |
| Charts | Recharts |
| Deployment | Vercel (frontend) + Supabase (functions) |

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### 1. Clone and install

```bash
git clone <repo-url>
cd B2B-AI-Content-Planner
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find both values in **Supabase Dashboard → Project Settings → API**.

### 3. Database setup

Run the migration in **Supabase Dashboard → SQL Editor**:

```bash
# paste the contents of:
supabase/migrations/001_schema.sql
```

This creates `profiles`, `usage_limits`, `posts`, and `generation_history` tables with RLS policies and an auto-provisioning trigger.

### 4. Supabase Edge Function secrets

In **Supabase Dashboard → Project Settings → Edge Functions → Secrets**, add:

| Secret | Value |
|---|---|
| `GROQ_API_KEY` | From [console.groq.com/keys](https://console.groq.com/keys) |
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe Dashboard |
| `STRIPE_PRO_PRICE_ID` | `price_...` from Stripe → Products |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe → Webhooks |
| `SITE_URL` | Your production URL (e.g. `https://yourapp.vercel.app`) |

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI if needed
npm install -g supabase

supabase login
supabase link --project-ref <your-project-ref>

supabase functions deploy groq-generate
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 6. Start dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## Deploy to Vercel

### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual

1. Push the repo to GitHub
2. Import the project in [vercel.com/new](https://vercel.com/new)
3. **Framework preset:** Vite (auto-detected)
4. Add environment variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` |

5. Deploy — `vercel.json` handles SPA routing automatically.

### Post-deploy checklist

- [ ] Set `SITE_URL` in Supabase Edge Function secrets → your Vercel URL
- [ ] Add Vercel URL to **Supabase Dashboard → Auth → URL Configuration → Site URL**
- [ ] Add Vercel URL to **Supabase Dashboard → Auth → URL Configuration → Redirect URLs**
- [ ] Register Stripe webhook endpoint: `https://yourapp.vercel.app` → Supabase Edge Function URL
- [ ] Replace `STRIPE_PRO_PRICE_ID` placeholder with a real Stripe price ID

---

## Project Structure

```
src/
├── components/
│   ├── calendar/        # WeeklyGrid, PostCard, EditModal
│   ├── dashboard/       # StatCard, charts, UpcomingPosts
│   ├── generate/        # AIPanel, ResultPanel, GenerationHistory, UpgradeModal
│   ├── layout/          # AppLayout, Sidebar, MobileNav, Footer
│   └── ui/              # shadcn/ui primitives
├── hooks/               # useAuth, useUsage, usePosts, useGenerationHistory
├── lib/                 # supabase client, utils, types, seedData
└── pages/               # Auth, Dashboard, Generate, Calendar

supabase/
├── functions/
│   ├── groq-generate/           # SSE streaming generation
│   ├── create-checkout-session/ # Stripe Checkout
│   └── stripe-webhook/          # Upgrade on payment
└── migrations/
    └── 001_schema.sql
```

---

## Database Schema

```sql
profiles          -- user display info
usage_limits      -- tokens_used / max_tokens / reset_date
posts             -- scheduled_for, content, platform, status
generation_history -- prompt, result, platform, tone
```

All tables use Row Level Security — users can only access their own rows.

---

## Environment Variables Reference

### Frontend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe only | Stripe publishable key |

### Edge Function Secrets (Supabase Dashboard)

| Secret | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq AI API key |
| `STRIPE_SECRET_KEY` | Stripe only | Stripe secret key |
| `STRIPE_PRO_PRICE_ID` | Stripe only | Stripe price ID for Pro plan |
| `STRIPE_WEBHOOK_SECRET` | Stripe only | Webhook signing secret |
| `SITE_URL` | Recommended | Production URL for Stripe redirects |

---

## License

MIT
