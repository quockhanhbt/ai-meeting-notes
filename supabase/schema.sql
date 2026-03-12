-- ============================================================
-- AI Meeting Note Summarizer — Schema
-- Run this in the Supabase SQL Editor (or any Postgres instance)
-- Connect via: DATABASE_URL (transaction pooler)
-- ============================================================

-- 1. users  (auth handled in app layer — bcrypt + JWT cookie)
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  plan           TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  meetings_this_month INT NOT NULL DEFAULT 0,
  reset_date     DATE NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- 2. meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL DEFAULT 'Untitled Meeting',
  raw_transcript TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meetings_user_id_idx ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS meetings_created_at_idx ON public.meetings(created_at DESC);

-- Full-text search index
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS fts TSVECTOR
  GENERATED ALWAYS AS (
    TO_TSVECTOR('english', COALESCE(title, '') || ' ' || COALESCE(raw_transcript, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS meetings_fts_idx ON public.meetings USING GIN(fts);

-- 3. summaries
CREATE TABLE IF NOT EXISTS public.summaries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id     UUID NOT NULL UNIQUE REFERENCES public.meetings(id) ON DELETE CASCADE,
  overview       TEXT,
  decisions      JSONB NOT NULL DEFAULT '[]',
  action_items   JSONB NOT NULL DEFAULT '[]',
  open_questions JSONB NOT NULL DEFAULT '[]',
  model          TEXT NOT NULL DEFAULT 'claude-haiku-4-5',
  tokens_used    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS summaries_meeting_id_idx ON public.summaries(meeting_id);

-- ============================================================
-- User isolation is enforced via WHERE user_id = $userId in
-- every API route query — no RLS needed.
-- ============================================================
