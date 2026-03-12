import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import DeleteVideoButton from "./DeleteVideoButton";

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const [row] = await sql`
    SELECT
      v.id, v.title, v.url, v.platform, v.status, v.created_at,
      s.overview, s.highlights, s.key_topics, s.model, s.tokens_used
    FROM videos v
    LEFT JOIN video_summaries s ON s.video_id = v.id
    WHERE v.id = ${id} AND v.user_id = ${session.userId}
  `;

  if (!row) notFound();

  const video = {
    id: row.id, title: row.title as string, url: row.url as string,
    platform: row.platform as string, status: row.status as string,
    created_at: row.created_at,
  };
  const summary = row.overview != null ? {
    overview: row.overview as string,
    highlights: toArray<{ text: string; timestamp?: string }>(row.highlights),
    key_topics: toArray<{ text: string }>(row.key_topics),
    model: row.model as string,
    tokens_used: (row.tokens_used as number) ?? 0,
  } : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0 mr-4">
          <Link href="/dashboard/videos" className="text-sm text-indigo-600 hover:underline mb-2 block">
            ← Back to videos
          </Link>
          <h1 className="text-2xl font-bold">{video.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-medium bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-200 capitalize">
              {video.platform}
            </span>
            <p className="text-sm text-gray-400">
              {new Date(video.created_at).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-500 hover:underline mt-1 block truncate"
          >
            {video.url}
          </a>
        </div>
        <DeleteVideoButton id={id} />
      </div>

      {video.status === "failed" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
          Could not summarize this video. It may have captions disabled or an unsupported language.
        </div>
      )}

      {summary && (
        <div className="space-y-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Overview</h2>
            <p className="text-gray-800 leading-relaxed">{summary.overview}</p>
          </section>

          {summary.highlights.length > 0 && (
            <section className="rounded-lg border border-rose-100 bg-rose-50 p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-3">Highlights</h2>
              <ul className="space-y-3">
                {summary.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-rose-400 mt-0.5 flex-shrink-0">&#9654;</span>
                    <div>
                      <p className="text-gray-800">{h.text}</p>
                      {h.timestamp && (
                        <p className="text-xs text-gray-400 mt-0.5">{h.timestamp}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.key_topics.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Key Topics</h2>
              <div className="flex flex-wrap gap-2">
                {summary.key_topics.map((t, i) => (
                  <span key={i} className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-sm font-medium border border-indigo-100">
                    {t.text}
                  </span>
                ))}
              </div>
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
