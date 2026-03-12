import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import DeleteMeetingButton from "./DeleteMeetingButton";
import EditableTitle from "./EditableTitle";

// JSONB columns may come back as a parsed array OR as a JSON string depending
// on the postgres.js version / query mode. Handle both defensively.
function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
      m.id, m.title, m.location, m.attendees, m.status, m.created_at,
      s.overview, s.decisions, s.action_items, s.open_questions,
      s.model, s.tokens_used
    FROM meetings m
    LEFT JOIN summaries s ON s.meeting_id = m.id
    WHERE m.id = ${id} AND m.user_id = ${session.userId}
  `;

  if (!row) notFound();

  const meeting = {
    id: row.id,
    title: row.title as string,
    location: row.location as string | null,
    attendees: row.attendees as string | null,
    status: row.status as string,
    created_at: row.created_at,
  };
  const summary = row.overview != null ? {
    overview: row.overview as string,
    decisions: toArray<{ text: string; owner?: string }>(row.decisions),
    action_items: toArray<{ text: string; assignee?: string; due_date?: string }>(row.action_items),
    open_questions: toArray<{ text: string }>(row.open_questions),
    model: row.model as string,
    tokens_used: (row.tokens_used as number) ?? 0,
  } : null;

  // Parse attendees into individual names for display
  const attendeeList = meeting.attendees
    ? meeting.attendees.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0 mr-4">
          <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline mb-2 block">
            ← Back to meetings
          </Link>
          <EditableTitle id={id} initialTitle={meeting.title} />
          <p className="text-sm text-gray-400 mt-1">
            {new Date(meeting.created_at).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          {(meeting.location || attendeeList.length > 0) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
              {meeting.location && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {meeting.location}
                </span>
              )}
              {attendeeList.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {attendeeList.join(", ")}
                </span>
              )}
            </div>
          )}
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

          {summary.decisions.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Key Decisions</h2>
              <ul className="space-y-2">
                {summary.decisions.map((d, i) => (
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

          {summary.action_items.length > 0 && (
            <section className="rounded-lg border border-indigo-100 bg-indigo-50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Action Items</h2>
              <ul className="space-y-3">
                {summary.action_items.map((a, i) => (
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
                ))}
              </ul>
            </section>
          )}

          {summary.open_questions.length > 0 && (
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Open Questions</h2>
              <ul className="space-y-2">
                {summary.open_questions.map((q, i) => (
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
