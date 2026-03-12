import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import DeleteMeetingButton from "./DeleteMeetingButton";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const [row] = await sql`
    SELECT
      m.id, m.title, m.status, m.created_at,
      s.overview, s.decisions, s.action_items, s.open_questions,
      s.model, s.tokens_used
    FROM meetings m
    LEFT JOIN summaries s ON s.meeting_id = m.id
    WHERE m.id = ${id} AND m.user_id = ${session.userId}
  `;

  if (!row) notFound();

  const meeting = { id: row.id, title: row.title, status: row.status, created_at: row.created_at };
  const summary = row.overview != null ? {
    overview: row.overview,
    decisions: row.decisions ?? [],
    action_items: row.action_items ?? [],
    open_questions: row.open_questions ?? [],
    model: row.model,
    tokens_used: row.tokens_used,
  } : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline mb-2 block">
            ← Back to meetings
          </Link>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(meeting.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <DeleteMeetingButton id={id} />
      </div>

      {meeting.status === "failed" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm mb-6">
          Summarization failed. Please try submitting this meeting again.
        </div>
      )}

      {meeting.status === "processing" && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-yellow-700 text-sm mb-6">
          Still processing... refresh in a moment.
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">TL;DR</h2>
            <p className="text-gray-800 leading-relaxed">{summary.overview}</p>
          </section>

          {summary.decisions?.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Key Decisions</h2>
              <ul className="space-y-2">
                {summary.decisions.map((d: { text: string; owner?: string }, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-indigo-500 mt-0.5">&#10003;</span>
                    <span className="text-gray-800">
                      {d.text}
                      {d.owner && <span className="ml-2 text-sm text-gray-400">({d.owner})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
            Summarized with {summary.model} &middot; {(summary.tokens_used ?? 0).toLocaleString()} tokens
          </p>
        </div>
      )}
    </div>
  );
}
