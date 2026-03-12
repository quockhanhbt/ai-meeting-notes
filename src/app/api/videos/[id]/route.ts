import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/videos/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT
      v.id, v.title, v.url, v.platform, v.status, v.created_at,
      s.overview, s.highlights, s.key_topics, s.model, s.tokens_used
    FROM videos v
    LEFT JOIN video_summaries s ON s.video_id = v.id
    WHERE v.id = ${id} AND v.user_id = ${session.userId}
  `;

  if (!row) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const video = {
    id: row.id, title: row.title, url: row.url,
    platform: row.platform, status: row.status, created_at: row.created_at,
  };
  const summary = row.overview != null ? {
    overview: row.overview,
    highlights: row.highlights ?? [],
    key_topics: row.key_topics ?? [],
    model: row.model,
    tokens_used: row.tokens_used,
  } : null;

  return NextResponse.json({ video, summary });
}

// DELETE /api/videos/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM videos WHERE id = ${id} AND user_id = ${session.userId}`;

  return new NextResponse(null, { status: 204 });
}
