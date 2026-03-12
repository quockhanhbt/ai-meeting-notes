import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import { Video } from "@/lib/types";

const PAGE_SIZE = 20;

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const offset = (page - 1) * PAGE_SIZE;

  const videos = (await sql`
    SELECT id, title, url, platform, status, created_at
    FROM videos
    WHERE user_id = ${session!.userId}
    ORDER BY created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `) as unknown as Video[];

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM videos WHERE user_id = ${session!.userId}
  `;
  const total = count as number;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Videos</h1>
        </div>
        <Link
          href="/dashboard/videos/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
        >
          + New video
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">No videos yet</p>
          <p className="text-sm text-gray-400 mb-4">Paste a YouTube URL to get highlights and key topics</p>
          <Link
            href="/dashboard/videos/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
          >
            Summarize your first video
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {videos.map((v) => (
            <li key={v.id}>
              <Link
                href={`/dashboard/videos/${v.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4 hover:border-indigo-300 hover:shadow-md shadow-sm transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{v.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-rose-600 font-medium bg-rose-50 px-1.5 py-0.5 rounded capitalize">
                      {v.platform}
                    </span>
                    <p className="text-sm text-gray-400">
                      {new Date(v.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex justify-center gap-4 mt-8">
          {page > 1 && (
            <Link href={`/dashboard/videos?page=${page - 1}`} className="text-sm text-indigo-600 hover:underline">
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">Page {page}</span>
          {page * PAGE_SIZE < total && (
            <Link href={`/dashboard/videos?page=${page + 1}`} className="text-sm text-indigo-600 hover:underline">
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
