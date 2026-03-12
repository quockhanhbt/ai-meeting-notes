"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function MeetingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Meeting detail error:", error.message, "digest:", error.digest);
  }, [error]);

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline mb-4 block">
        ← Back to meetings
      </Link>
      <div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4 text-red-700">
        <p className="font-semibold mb-1">Failed to load meeting</p>
        <p className="text-sm mb-3">
          {error.message || "An unexpected error occurred while loading this meeting."}
        </p>
        {error.digest && (
          <p className="text-xs text-red-400 mb-3">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
