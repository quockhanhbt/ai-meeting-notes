import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          MeetingMind
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Paste your meeting transcript. Get instant AI-powered summaries,
          action items, and key decisions — in seconds.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          Free plan: 10 meetings/month. No credit card required.
        </p>
      </div>
    </main>
  );
}
