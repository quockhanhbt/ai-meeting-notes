"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpgradePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not create checkout. Try again.");
      setLoading(false);
      return;
    }
    window.location.href = json.url;
  }

  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <h1 className="text-3xl font-bold mb-4">Upgrade to Pro</h1>
      <p className="text-gray-500 mb-8">
        Get 100 meetings/month — 10x more than the free plan.
      </p>
      <div className="rounded-xl border border-indigo-200 bg-white p-8 shadow-sm mb-8">
        <p className="text-5xl font-bold text-gray-900">$9</p>
        <p className="text-gray-400 mt-1">per month</p>
        <ul className="mt-6 space-y-3 text-left text-sm text-gray-700">
          <li className="flex gap-2"><span className="text-indigo-500">&#10003;</span> 100 meetings/month</li>
          <li className="flex gap-2"><span className="text-indigo-500">&#10003;</span> Full AI summaries, decisions & action items</li>
          <li className="flex gap-2"><span className="text-indigo-500">&#10003;</span> Full-text search across all meetings</li>
          <li className="flex gap-2"><span className="text-indigo-500">&#10003;</span> Cancel any time</li>
        </ul>
      </div>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors text-lg"
      >
        {loading ? "Redirecting to checkout..." : "Upgrade now — $9/mo"}
      </button>
      <p className="mt-4 text-xs text-gray-400">
        Secure payment via Lemon Squeezy. Includes VAT where applicable.
      </p>
    </div>
  );
}
