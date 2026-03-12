# MeetingMind — AI Meeting Note Summarizer

Paste your meeting transcript and get instant AI-powered summaries, action items, and key decisions — in seconds.

![MeetingMind Dashboard](public/screenshots/dashboard.png)

---

## Features

- **AI Summarization** — Powered by Claude Haiku. Extracts a TL;DR, key decisions, action items (with assignee & due date), and open questions from any meeting transcript.
- **Meeting History** — Full searchable archive of all your past meetings.
- **Free tier** — 10 meetings/month at no cost. Upgrade to Pro for 100/month at $9/mo.
- **$0/mo infrastructure** — Built on Supabase (Postgres) + Vercel free tiers.

---

## Screenshots

### Landing Page
![Landing page](public/screenshots/landing.png)

### Register / Login
![Register page](public/screenshots/register.png)

### Dashboard
![Dashboard with meeting list](public/screenshots/dashboard.png)

### New Meeting — Paste Transcript
![New meeting form](public/screenshots/new-meeting.png)

### Meeting Summary
![AI-generated summary with action items](public/screenshots/meeting-detail.png)

### Upgrade to Pro
![Upgrade page](public/screenshots/upgrade.png)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres via transaction pooler) |
| Auth | Custom JWT (jose) + bcryptjs, httpOnly cookie |
| AI | Anthropic Claude Haiku 4.5 |
| Payments | Lemon Squeezy |
| Deployment | Vercel |

---

## Getting Started (Local)

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-meeting-notes
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → **Transaction pooler** connection string |
| `JWT_SECRET` | Run: `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `LEMONSQUEEZY_*` | [app.lemonsqueezy.com](https://app.lemonsqueezy.com) (optional for billing) |

### 3. Set up the database

Go to your **Supabase project → SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).

This creates the `users`, `meetings`, and `summaries` tables with full-text search indexes.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add environment variables in **Settings → Environment Variables**:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ANTHROPIC_API_KEY`
4. Deploy — that's it.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # register / login / logout
│   │   ├── meetings/      # CRUD + full-text search
│   │   ├── billing/       # Lemon Squeezy checkout
│   │   └── webhooks/      # Lemon Squeezy payment events
│   ├── dashboard/         # Protected pages (meetings list, detail, new, upgrade)
│   ├── login/
│   ├── register/
│   └── page.tsx           # Landing page
├── lib/
│   ├── auth.ts            # JWT sign/verify, session helpers
│   ├── db.ts              # postgres.js client
│   ├── summarize.ts       # Anthropic API call
│   └── types.ts           # Shared TypeScript types
└── middleware.ts           # Auth guard (redirects unauthenticated users)

supabase/
└── schema.sql             # Full database schema — run once to bootstrap
```

---

## Pricing

| Plan | Price | Meetings/month |
|---|---|---|
| Free | $0 | 10 |
| Pro | $9/mo | 100 |

---

## License

MIT
