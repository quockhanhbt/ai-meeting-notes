import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, meetings_this_month")
    .eq("id", user.id)
    .single();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
          MeetingMind
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-500">
            {profile?.meetings_this_month ?? 0} /{" "}
            {profile?.plan === "pro" ? 100 : 10} meetings this month
            {profile?.plan === "free" && (
              <Link href="/dashboard/upgrade" className="ml-2 text-indigo-600 hover:underline font-medium">
                Upgrade
              </Link>
            )}
          </span>
          <span className="text-sm text-gray-400">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
