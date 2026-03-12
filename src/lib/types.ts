export type Plan = "free" | "pro";
export type MeetingStatus = "pending" | "processing" | "done" | "failed";

export interface User {
  id: string;
  email: string;
  plan: Plan;
  meetings_this_month: number;
  reset_date: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  location?: string | null;
  attendees?: string | null;
  status: MeetingStatus;
  created_at: string;
}

export interface MeetingWithSummary extends Meeting {
  raw_transcript: string;
  summary?: Summary;
}

export interface Summary {
  id: string;
  meeting_id: string;
  overview: string | null;
  decisions: Array<{ text: string; owner?: string }>;
  action_items: Array<{ text: string; assignee?: string; due_date?: string }>;
  open_questions: Array<{ text: string }>;
  model: string;
  tokens_used: number;
  created_at: string;
}

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 10,
  pro: 100,
};

export type ContentStatus = "pending" | "processing" | "done" | "failed";

export interface Article {
  id: string;
  user_id: string;
  title: string;
  url: string;
  source: string | null;
  status: ContentStatus;
  created_at: string;
}

export interface ArticleSummaryResult {
  overview: string;
  key_points: Array<{ text: string }>;
  sentiment: string | null;
  tokens_used: number;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  url: string;
  platform: string;
  status: ContentStatus;
  created_at: string;
}

export interface VideoSummaryResult {
  overview: string;
  highlights: Array<{ text: string; timestamp?: string }>;
  key_topics: Array<{ text: string }>;
  tokens_used: number;
}
