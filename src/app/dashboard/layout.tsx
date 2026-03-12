import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import SignOutButton from "./SignOutButton";
import SidebarNav from "./SidebarNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user] = await sql`
    SELECT email, plan, meetings_this_month FROM users WHERE id = ${session.userId}
  `;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top header */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
        <Link href="/dashboard" className="text-lg font-bold text-indigo-600 tracking-tight">
          ContentMind
        </Link>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-500 hidden sm:block">
            {user?.meetings_this_month ?? 0} / {user?.plan === "pro" ? 100 : 10} meetings
          </span>
          <span className="text-sm text-gray-400 hidden md:block">{user?.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav plan={user?.plan ?? "free"} />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-3xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
