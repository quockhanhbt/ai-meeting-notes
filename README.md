# MeetingMind — AI Meeting Note Summarizer

Paste your meeting transcript, drop in an article URL, or share a YouTube link — and get instant AI-powered summaries, action items, and key decisions in seconds.

![MeetingMind Dashboard](public/screenshots/dashboard.png)

---

## Features

- **Meeting Summarization** — Powered by Claude Haiku 4.5. Extracts a TL;DR, key decisions, action items (with assignee & due date), and open questions from any meeting transcript.
- **Article Summarization** — Paste any article URL to get key points and sentiment analysis scraped and summarized automatically.
- **YouTube Video Summarization** — Paste a YouTube link (including Shorts) to extract and summarize the video transcript.
- **Multi-Language Support** — Transcripts are detected and summarized in the same language automatically.
- **Meeting History** — Full searchable archive of all your past meetings, articles, and videos.
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
| Auth | Supabase Auth |
| AI | Anthropic Claude Haiku 4.5 |
| Content Parsing | Cheerio (articles) + youtube-transcript (videos) |
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
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev; your production URL on Vercel |
| `LEMONSQUEEZY_API_KEY` | [app.lemonsqueezy.com](https://app.lemonsqueezy.com) (optional for billing) |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy store settings (optional) |
| `LEMONSQUEEZY_PRO_VARIANT_ID` | Lemon Squeezy product variants (optional) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Lemon Squeezy webhooks (optional) |

### 3. Set up the database

Go to your **Supabase project → SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).

This creates the `users`, `meetings`, `summaries`, `articles`, `article_summaries`, `videos`, and `video_summaries` tables with full-text search indexes.

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
   - `NEXT_PUBLIC_APP_URL`
4. Deploy — that's it.

> **Note:** The Vercel Hobby free tier has a 10-second function timeout. AI summarization requires up to 60 seconds, so a **Vercel Pro** plan is recommended for production use.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # register / login / logout
│   │   ├── meetings/      # CRUD + full-text search
│   │   ├── articles/      # Article URL ingestion + summarization
│   │   ├── videos/        # YouTube transcript fetching + summarization
│   │   ├── billing/       # Lemon Squeezy checkout
│   │   └── webhooks/      # Lemon Squeezy payment events
│   ├── dashboard/
│   │   ├── page.tsx       # Meetings list + search
│   │   ├── layout.tsx     # Protected sidebar layout
│   │   ├── meetings/      # Meeting detail, editable title, delete
│   │   ├── articles/      # Article list, new, detail
│   │   ├── videos/        # Video list, new, detail
│   │   ├── new/           # Paste transcript form
│   │   └── upgrade/       # Pro upgrade page
│   ├── login/
│   ├── register/
│   └── page.tsx           # Landing page
├── lib/
│   ├── auth.ts                   # JWT sign/verify, session helpers
│   ├── db.ts                     # postgres.js client
│   ├── summarize.ts              # Meeting transcript → Claude summary
│   ├── summarize-article.ts      # Article content → Claude summary
│   ├── summarize-video.ts        # Video transcript → Claude summary
│   ├── fetch-article.ts          # Cheerio web scraper
│   ├── fetch-video-transcript.ts # YouTube transcript extraction
│   └── types.ts                  # Shared TypeScript types
└── middleware.ts          # Auth guard (redirects unauthenticated users)

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
