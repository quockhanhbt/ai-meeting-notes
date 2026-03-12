import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import { fetchYouTubeTranscript } from "@/lib/fetch-video-transcript";
import { summarizeVideo } from "@/lib/summarize-video";

export const maxDuration = 60;

const PAGE_SIZE = 20;

// GET /api/videos?page=1
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const offset = (page - 1) * PAGE_SIZE;

  const videos = await sql`
    SELECT id, title, url, platform, status, created_at
    FROM videos
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM videos WHERE user_id = ${session.userId}
  `;

  return NextResponse.json({ videos, total: count, page });
}

// POST /api/videos
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, title } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Fetch YouTube transcript
  let transcriptData;
  try {
    transcriptData = await fetchYouTubeTranscript(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch video transcript.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const finalTitle = title?.trim() || "YouTube Video";

  const [video] = await sql`
    INSERT INTO videos (user_id, title, url, platform, status)
    VALUES (${session.userId}, ${finalTitle}, ${url.trim()}, 'youtube', 'processing')
    RETURNING *
  `;

  let summaryData;
  try {
    summaryData = await summarizeVideo(transcriptData.transcript);
  } catch (err) {
    await sql`UPDATE videos SET status = 'failed' WHERE id = ${video.id}`;
    const message = err instanceof Error ? err.message : "AI summarization failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const [summary] = await sql`
    INSERT INTO video_summaries (video_id, overview, highlights, key_topics, model, tokens_used)
    VALUES (
      ${video.id},
      ${summaryData.overview},
      ${JSON.stringify(summaryData.highlights)}::jsonb,
      ${JSON.stringify(summaryData.key_topics)}::jsonb,
      ${"claude-haiku-4-5-20251001"},
      ${summaryData.tokens_used}
    )
    RETURNING *
  `;

  await sql`UPDATE videos SET status = 'done' WHERE id = ${video.id}`;

  return NextResponse.json({ video: { ...video, status: "done" }, summary }, { status: 201 });
}
