"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteArticleButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    router.push("/dashboard/articles");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Confirm delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors"
    >
      Delete
    </button>
  );
}
