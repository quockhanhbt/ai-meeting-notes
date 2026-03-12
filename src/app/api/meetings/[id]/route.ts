import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/meetings/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT
      m.id, m.title, m.location, m.attendees, m.status, m.created_at,
      s.overview, s.decisions, s.action_items, s.open_questions,
      s.model, s.tokens_used
    FROM meetings m
    LEFT JOIN summaries s ON s.meeting_id = m.id
    WHERE m.id = ${id} AND m.user_id = ${session.userId}
  `;

  if (!row) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  const meeting = {
    id: row.id,
    title: row.title,
    location: row.location ?? null,
    attendees: row.attendees ?? null,
    status: row.status,
    created_at: row.created_at,
  };
  const summary = row.overview != null ? {
    overview: row.overview,
    decisions: row.decisions ?? [],
    action_items: row.action_items ?? [],
    open_questions: row.open_questions ?? [],
    model: row.model,
    tokens_used: row.tokens_used,
  } : null;

  return NextResponse.json({ meeting, summary });
}

// PATCH /api/meetings/:id — update title, location, and/or attendees
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, location, attendees } = body;

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
  }

  const [meeting] = await sql`
    UPDATE meetings SET
      title     = COALESCE(${title?.trim() ?? null}, title),
      location  = CASE WHEN ${location !== undefined} THEN ${location?.trim() || null} ELSE location END,
      attendees = CASE WHEN ${attendees !== undefined} THEN ${attendees?.trim() || null} ELSE attendees END
    WHERE id = ${id} AND user_id = ${session.userId}
    RETURNING *
  `;

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  return NextResponse.json({ meeting });
}

// DELETE /api/meetings/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`DELETE FROM meetings WHERE id = ${id} AND user_id = ${session.userId}`;

  return new NextResponse(null, { status: 204 });
}
