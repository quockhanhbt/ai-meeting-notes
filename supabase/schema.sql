-- ============================================================
-- AI Meeting Note Summarizer — Supabase Schema
-- Run this in the Supabase SQL Editor to bootstrap the project
-- ============================================================

-- 1. profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan         TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  meetings_this_month INT NOT NULL DEFAULT 0,
  reset_date   DATE NOT NULL DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL DEFAULT 'Untitled Meeting',
  raw_transcript TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS meetings_user_id_idx ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS meetings_created_at_idx ON public.meetings(created_at DESC);

-- Full-text search index on title + transcript
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
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update only their own profile
CREATE POLICY "profiles: own row" ON public.profiles
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- meetings: users can CRUD only their own meetings
CREATE POLICY "meetings: own rows" ON public.meetings
  USING (auth.uid() = user_id);

CREATE POLICY "meetings: own insert" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meetings: own update" ON public.meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meetings: own delete" ON public.meetings
  FOR DELETE USING (auth.uid() = user_id);

-- summaries: accessible if parent meeting belongs to the user
CREATE POLICY "summaries: own rows" ON public.summaries
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings WHERE user_id = auth.uid()
    )
  );
