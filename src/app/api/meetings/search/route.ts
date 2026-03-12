import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/meetings/search?q=<query>
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "q parameter is required" }, { status: 400 });

  const meetings = await sql`
    SELECT id, title, status, created_at
    FROM meetings
    WHERE user_id = ${session.userId}
      AND fts @@ websearch_to_tsquery('english', ${q})
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return NextResponse.json({ meetings, query: q });
}
