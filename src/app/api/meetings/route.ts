import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeTranscript } from "@/lib/summarize";
import { PLAN_LIMITS } from "@/lib/supabase/types";

const PAGE_SIZE = 20;

// GET /api/meetings?page=1
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const offset = (page - 1) * PAGE_SIZE;

  const { data, error, count } = await supabase
    .from("meetings")
    .select("id, title, status, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ meetings: data, total: count, page });
}

// POST /api/meetings  — submit transcript, summarize synchronously
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check and enforce plan limits
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, meetings_this_month, reset_date")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 500 });
  }

  // Reset monthly counter if past reset_date
  const today = new Date().toISOString().split("T")[0];
  if (today >= profile.reset_date) {
    const nextReset = new Date(profile.reset_date);
    nextReset.setMonth(nextReset.getMonth() + 1);
    await supabase
      .from("profiles")
      .update({ meetings_this_month: 0, reset_date: nextReset.toISOString().split("T")[0] })
      .eq("id", user.id);
    profile.meetings_this_month = 0;
  }

  const limit = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS];
  if (profile.meetings_this_month >= limit) {
    return NextResponse.json(
      { error: "Monthly meeting limit reached. Upgrade to Pro for more.", upgrade: true },
      { status: 402 }
    );
  }

  const body = await request.json();
  const { transcript, title } = body;

  if (!transcript || typeof transcript !== "string" || transcript.trim().length < 50) {
    return NextResponse.json(
      { error: "Transcript must be at least 50 characters." },
      { status: 400 }
    );
  }

  // Insert meeting as 'processing'
  const { data: meeting, error: insertError } = await supabase
    .from("meetings")
    .insert({
      user_id: user.id,
      title: title?.trim() || "Untitled Meeting",
      raw_transcript: transcript.trim(),
      status: "processing",
    })
    .select()
    .single();

  if (insertError || !meeting) {
    return NextResponse.json({ error: insertError?.message }, { status: 500 });
  }

  // Summarize synchronously
  let summaryData;
  try {
    summaryData = await summarizeTranscript(transcript);
  } catch (err) {
    await supabase.from("meetings").update({ status: "failed" }).eq("id", meeting.id);
    return NextResponse.json({ error: "AI summarization failed. Please try again." }, { status: 500 });
  }

  // Store summary
  const { data: summary, error: summaryError } = await supabase
    .from("summaries")
    .insert({
      meeting_id: meeting.id,
      overview: summaryData.overview,
      decisions: summaryData.decisions,
      action_items: summaryData.action_items,
      open_questions: summaryData.open_questions,
      model: "claude-haiku-4-5",
      tokens_used: summaryData.tokens_used,
    })
    .select()
    .single();

  if (summaryError) {
    await supabase.from("meetings").update({ status: "failed" }).eq("id", meeting.id);
    return NextResponse.json({ error: summaryError.message }, { status: 500 });
  }

  // Mark done and increment counter
  await Promise.all([
    supabase.from("meetings").update({ status: "done" }).eq("id", meeting.id),
    supabase
      .from("profiles")
      .update({ meetings_this_month: profile.meetings_this_month + 1 })
      .eq("id", user.id),
  ]);

  return NextResponse.json({ meeting: { ...meeting, status: "done" }, summary }, { status: 201 });
}
