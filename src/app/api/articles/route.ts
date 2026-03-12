import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import { fetchArticleContent } from "@/lib/fetch-article";
import { summarizeArticle } from "@/lib/summarize-article";

export const maxDuration = 60;

const PAGE_SIZE = 20;

// GET /api/articles?page=1
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const offset = (page - 1) * PAGE_SIZE;

  const articles = await sql`
    SELECT id, title, url, source, status, created_at
    FROM articles
    WHERE user_id = ${session.userId}
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM articles WHERE user_id = ${session.userId}
  `;

  return NextResponse.json({ articles, total: count, page });
}

// POST /api/articles
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, title } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch article content
  let articleContent;
  try {
    articleContent = await fetchArticleContent(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch article content.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const finalTitle = title?.trim() || articleContent.title;

  const [article] = await sql`
    INSERT INTO articles (user_id, title, url, source, status)
    VALUES (${session.userId}, ${finalTitle}, ${url.trim()}, ${articleContent.source}, 'processing')
    RETURNING *
  `;

  let summaryData;
  try {
    summaryData = await summarizeArticle(articleContent.text, articleContent.title);
  } catch (err) {
    await sql`UPDATE articles SET status = 'failed' WHERE id = ${article.id}`;
    const message = err instanceof Error ? err.message : "AI summarization failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const [summary] = await sql`
    INSERT INTO article_summaries (article_id, overview, key_points, sentiment, model, tokens_used)
    VALUES (
      ${article.id},
      ${summaryData.overview},
      ${JSON.stringify(summaryData.key_points)}::jsonb,
      ${summaryData.sentiment},
      ${"claude-haiku-4-5-20251001"},
      ${summaryData.tokens_used}
    )
    RETURNING *
  `;

  await sql`UPDATE articles SET status = 'done' WHERE id = ${article.id}`;

  return NextResponse.json({ article: { ...article, status: "done" }, summary }, { status: 201 });
}
