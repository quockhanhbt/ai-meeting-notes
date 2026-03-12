import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import sql from "@/lib/db";
import SignOutButton from "./SignOutButton";

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
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          MeetingMind
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-500">
            {user?.meetings_this_month ?? 0} /{" "}
            {user?.plan === "pro" ? 100 : 10} meetings this month
            {user?.plan === "free" && (
              <Link
                href="/dashboard/upgrade"
                className="ml-2 text-indigo-600 hover:underline font-medium"
              >
                Upgrade
              </Link>
            )}
          </span>
          <span className="text-sm text-gray-400">{user?.email}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
