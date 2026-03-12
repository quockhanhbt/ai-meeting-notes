import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/articles/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT
      a.id, a.title, a.url, a.source, a.status, a.created_at,
      s.overview, s.key_points, s.sentiment, s.model, s.tokens_used
    FROM articles a
    LEFT JOIN article_summaries s ON s.article_id = a.id
    WHERE a.id = ${id} AND a.user_id = ${session.userId}
  `;

  if (!row) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const article = {
    id: row.id, title: row.title, url: row.url,
    source: row.source ?? null, status: row.status, created_at: row.created_at,
  };
  const summary = row.overview != null ? {
    overview: row.overview,
    key_points: row.key_points ?? [],
    sentiment: row.sentiment ?? null,
    model: row.model,
    tokens_used: row.tokens_used,
  } : null;

  return NextResponse.json({ article, summary });
}

// DELETE /api/articles/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM articles WHERE id = ${id} AND user_id = ${session.userId}`;

  return new NextResponse(null, { status: 204 });
}
