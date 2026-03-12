"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewVideoPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, title: title || undefined }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/videos/${json.video.id}`);
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Summarize Video</h1>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-blue-700 text-sm mb-5">
        <strong>YouTube only</strong> — auto-extracts captions. The video must have captions enabled.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            YouTube URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Supports youtube.com/watch, youtu.be, and youtube.com/shorts links
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom title <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Talk: The Future of AI — Sam Altman"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Fetching transcript..." : "Fetch & summarize"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
