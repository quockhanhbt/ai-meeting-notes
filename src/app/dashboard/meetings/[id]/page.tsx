import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteMeetingButton from "./DeleteMeetingButton";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("meetings")
    .select("*, summaries(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) notFound();

  const summary = data.summaries?.[0];

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline mb-2 block">
            ← Back to meetings
          </Link>
          <h1 className="text-2xl font-bold">{data.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(data.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <DeleteMeetingButton id={id} />
      </div>

      {data.status === "failed" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
          Summarization failed. Please try submitting this meeting again.
        </div>
      )}

      {data.status === "processing" && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-yellow-700 text-sm mb-6">
          Still processing... refresh in a moment.
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Overview */}
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">TL;DR</h2>
            <p className="text-gray-800 leading-relaxed">{summary.overview}</p>
          </section>

          {/* Decisions */}
          {summary.decisions?.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Key Decisions</h2>
              <ul className="space-y-2">
                {summary.decisions.map((d: { text: string; owner?: string }, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-indigo-500 mt-0.5">&#10003;</span>
                    <span className="text-gray-800">
                      {d.text}
                      {d.owner && (
                        <span className="ml-2 text-sm text-gray-400">({d.owner})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Items */}
          {summary.action_items?.length > 0 && (
            <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Action Items</h2>
              <ul className="space-y-3">
                {summary.action_items.map(
                  (a: { text: string; assignee?: string; due_date?: string }, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-indigo-400 mt-0.5">&#9654;</span>
                      <div>
                        <p className="text-gray-900">{a.text}</p>
                        <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                          {a.assignee && <span>Assignee: {a.assignee}</span>}
                          {a.due_date && <span>Due: {a.due_date}</span>}
                        </div>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

          {/* Open Questions */}
          {summary.open_questions?.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Open Questions</h2>
              <ul className="space-y-2">
                {summary.open_questions.map((q: { text: string }, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-yellow-500 mt-0.5">?</span>
                    <span className="text-gray-800">{q.text}</span>
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
