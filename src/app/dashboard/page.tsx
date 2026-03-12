import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Meeting } from "@/lib/supabase/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; upgraded?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const q = params.q?.trim();
  const page = parseInt(params.page ?? "1");
  const PAGE_SIZE = 20;

  let meetings: Meeting[] = [];
  let total = 0;

  if (q) {
    const { data } = await supabase
      .from("meetings")
      .select("id, title, status, created_at")
      .eq("user_id", user!.id)
      .textSearch("fts", q, { type: "websearch", config: "english" })
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    meetings = (data ?? []) as unknown as Meeting[];
  } else {
    const offset = (page - 1) * PAGE_SIZE;
    const { data, count } = await supabase
      .from("meetings")
      .select("id, title, status, created_at", { count: "exact" })
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    meetings = (data ?? []) as unknown as Meeting[];
    total = count ?? 0;
  }

  return (
    <div>
      {params.upgraded && (
        <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
          You&apos;re now on Pro! Enjoy 100 meetings/month.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Meetings</h1>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 transition-colors text-sm"
        >
          + New meeting
        </Link>
      </div>

      {/* Search */}
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          type="search"
          placeholder="Search meetings..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </form>

      {meetings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {q ? `No meetings found for "${q}"` : "No meetings yet. Summarize your first one!"}
        </div>
      ) : (
        <ul className="space-y-3">
          {meetings.map((m) => (
            <li key={m.id}>
              <Link
                href={`/dashboard/meetings/${m.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(m.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {!q && total > PAGE_SIZE && (
        <div className="flex justify-center gap-4 mt-8">
          {page > 1 && (
            <Link
              href={`/dashboard?page=${page - 1}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-500">Page {page}</span>
          {page * PAGE_SIZE < total && (
            <Link
              href={`/dashboard?page=${page + 1}`}
              className="text-sm text-indigo-600 hover:underline"
            >
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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}
