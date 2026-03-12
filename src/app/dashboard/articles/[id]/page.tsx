import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import DeleteArticleButton from "./DeleteArticleButton";

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

const sentimentStyles: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  negative: "bg-red-100 text-red-700",
  neutral: "bg-gray-100 text-gray-600",
};

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const [row] = await sql`
    SELECT
      a.id, a.title, a.url, a.source, a.status, a.created_at,
      s.overview, s.key_points, s.sentiment, s.model, s.tokens_used
    FROM articles a
    LEFT JOIN article_summaries s ON s.article_id = a.id
    WHERE a.id = ${id} AND a.user_id = ${session.userId}
  `;

  if (!row) notFound();

  const article = {
    id: row.id, title: row.title as string, url: row.url as string,
    source: row.source as string | null, status: row.status as string,
    created_at: row.created_at,
  };
  const summary = row.overview != null ? {
    overview: row.overview as string,
    key_points: toArray<{ text: string }>(row.key_points),
    sentiment: row.sentiment as string | null,
    model: row.model as string,
    tokens_used: (row.tokens_used as number) ?? 0,
  } : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0 mr-4">
          <Link href="/dashboard/articles" className="text-sm text-indigo-600 hover:underline mb-2 block">
            ← Back to articles
          </Link>
          <h1 className="text-2xl font-bold">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {article.source && (
              <span className="text-xs font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-200">
                {article.source}
              </span>
            )}
            <p className="text-sm text-gray-400">
              {new Date(article.created_at).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-500 hover:underline mt-1 block truncate"
          >
            {article.url}
          </a>
        </div>
        <DeleteArticleButton id={id} />
      </div>

      {article.status === "failed" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
          Summarization failed for this article.
        </div>
      )}

      {summary && (
        <div className="space-y-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Summary</h2>
              {summary.sentiment && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${sentimentStyles[summary.sentiment] ?? sentimentStyles.neutral}`}>
                  {summary.sentiment}
                </span>
              )}
            </div>
            <p className="text-gray-800 leading-relaxed">{summary.overview}</p>
          </section>

          {summary.key_points.length > 0 && (
            <section className="rounded-lg border border-amber-100 bg-amber-50 p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3">Key Points</h2>
              <ul className="space-y-2">
                {summary.key_points.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0">&#9670;</span>
                    <span className="text-gray-800">{p.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-gray-300 text-right">
            Summarized with {summary.model} &middot; {summary.tokens_used.toLocaleString()} tokens
          </p>
        </div>
      )}
    </div>
  );
}
