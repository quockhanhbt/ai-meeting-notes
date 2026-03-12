import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import { Article } from "@/lib/types";

const PAGE_SIZE = 20;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const offset = (page - 1) * PAGE_SIZE;

  const articles = (await sql`
    SELECT id, title, url, source, status, created_at
    FROM articles
    WHERE user_id = ${session!.userId}
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `) as unknown as Article[];

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM articles WHERE user_id = ${session!.userId}
  `;
  const total = count as number;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
              <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Articles</h1>
        </div>
        <Link
          href="/dashboard/articles/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
        >
          + New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
              <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">No articles yet</p>
          <p className="text-sm text-gray-400 mb-4">Paste any news or blog URL to get an instant AI summary</p>
          <Link
            href="/dashboard/articles/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
          >
            Summarize your first article
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/articles/${a.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4 hover:border-indigo-300 hover:shadow-md shadow-sm transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.source && (
                      <span className="text-xs text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                        {a.source}
                      </span>
                    )}
                    <p className="text-sm text-gray-400">
                      {new Date(a.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex justify-center gap-4 mt-8">
          {page > 1 && (
            <Link href={`/dashboard/articles?page=${page - 1}`} className="text-sm text-indigo-600 hover:underline">
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">Page {page}</span>
          {page * PAGE_SIZE < total && (
            <Link href={`/dashboard/articles?page=${page + 1}`} className="text-sm text-indigo-600 hover:underline">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    done: "bg-green-100 text-green-700",
    processing: "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-600",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ml-3 flex-shrink-0 ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}
