import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import { summarizeTranscript } from "@/lib/summarize";
import { PLAN_LIMITS } from "@/lib/types";

export const maxDuration = 60; // seconds — requires Vercel Pro; capped at 10s on Hobby

const PAGE_SIZE = 20;

// GET /api/meetings?page=1
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const offset = (page - 1) * PAGE_SIZE;

  const meetings = await sql`
    SELECT id, title, status, created_at
    FROM meetings
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM meetings WHERE user_id = ${session.userId}
  `;

  return NextResponse.json({ meetings, total: count, page });
}

// POST /api/meetings
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await sql`
    SELECT plan, meetings_this_month, reset_date FROM users WHERE id = ${session.userId}
  `;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Reset monthly counter if month has rolled over
  const today = new Date().toISOString().split("T")[0];
  if (today >= user.reset_date) {
    const next = new Date(user.reset_date);
    next.setMonth(next.getMonth() + 1);
    await sql`
      UPDATE users
      SET meetings_this_month = 0, reset_date = ${next.toISOString().split("T")[0]}
      WHERE id = ${session.userId}
    `;
    user.meetings_this_month = 0;
  }

  const limit = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
  if (user.meetings_this_month >= limit) {
    return NextResponse.json(
      { error: "Monthly meeting limit reached. Upgrade to Pro for more.", upgrade: true },
      { status: 402 }
    );
  }

  const { transcript, title, location, attendees } = await request.json();

  if (!transcript || typeof transcript !== "string" || transcript.trim().length < 50) {
    return NextResponse.json(
      { error: "Transcript must be at least 50 characters." },
      { status: 400 }
    );
  }

  const [meeting] = await sql`
    INSERT INTO meetings (user_id, title, location, attendees, raw_transcript, status)
    VALUES (
      ${session.userId},
      ${title?.trim() || "Untitled Meeting"},
      ${location?.trim() || null},
      ${attendees?.trim() || null},
      ${transcript.trim()},
      'processing'
    )
    RETURNING *
  `;

  let summaryData;
  try {
    summaryData = await summarizeTranscript(transcript);
  } catch (err) {
    await sql`UPDATE meetings SET status = 'failed' WHERE id = ${meeting.id}`;
    const message = err instanceof Error ? err.message : "AI summarization failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const [summary] = await sql`
    INSERT INTO summaries (meeting_id, overview, decisions, action_items, open_questions, model, tokens_used)
    VALUES (
      ${meeting.id}, ${summaryData.overview},
      ${JSON.stringify(summaryData.decisions)}::jsonb,
      ${JSON.stringify(summaryData.action_items)}::jsonb,
      ${JSON.stringify(summaryData.open_questions)}::jsonb,
      ${"claude-haiku-4-5"}, ${summaryData.tokens_used}
    )
    RETURNING *
  `;

  await sql`UPDATE meetings SET status = 'done' WHERE id = ${meeting.id}`;
  await sql`UPDATE users SET meetings_this_month = meetings_this_month + 1 WHERE id = ${session.userId}`;

  return NextResponse.json({ meeting: { ...meeting, status: "done" }, summary }, { status: 201 });
}
