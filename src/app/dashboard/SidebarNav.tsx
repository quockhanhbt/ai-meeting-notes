"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  activeColor: string;
  activeBg: string;
}

const navItems: NavItem[] = [
  {
    label: "Meetings",
    href: "/dashboard",
    activeColor: "text-indigo-700",
    activeBg: "bg-indigo-50 border-r-2 border-indigo-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: "Articles",
    href: "/dashboard/articles",
    activeColor: "text-amber-700",
    activeBg: "bg-amber-50 border-r-2 border-amber-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
        <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
      </svg>
    ),
  },
  {
    label: "Videos",
    href: "/dashboard/videos",
    activeColor: "text-rose-700",
    activeBg: "bg-rose-50 border-r-2 border-rose-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
  },
];

interface SidebarNavProps {
  plan: string;
}

export default function SidebarNav({ plan }: SidebarNavProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-52 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col py-4">
      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? `${item.activeBg} ${item.activeColor}`
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className={active ? item.activeColor : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {plan === "free" && (
        <div className="px-3 py-4 border-t border-gray-100 mt-2">
          <p className="text-xs text-gray-400 mb-2">Free plan</p>
          <Link
            href="/dashboard/upgrade"
            className="block w-full text-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Upgrade to Pro →
          </Link>
        </div>
      )}
    </aside>
  );
}
