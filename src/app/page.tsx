import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-gray-50">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700 mb-6">
          AI-powered content summarizer
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          ContentMind
        </h1>
        <p className="mt-4 text-xl text-gray-500 leading-relaxed">
          Summarize meetings, news articles, and YouTube videos — instantly with AI.
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

        {/* Feature cards */}
        <div className="mt-14 grid grid-cols-3 gap-4 text-left">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Meeting Notes</h3>
            <p className="text-sm text-gray-500">Paste any transcript and get TL;DR, action items, and decisions.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">News Articles</h3>
            <p className="text-sm text-gray-500">Drop any URL and get a concise summary with key points and sentiment.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">YouTube Videos</h3>
            <p className="text-sm text-gray-500">Paste a YouTube link and extract highlights and key topics in seconds.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
