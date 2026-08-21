"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/users", label: "Users" },
  { href: "/meetings", label: "Meetings" },
  { href: "/attendance", label: "Attendance" },
  { href: "/sermons", label: "Sermons" },
  { href: "/devotionals", label: "Devotionals" },
  { href: "/quizzes", label: "Quizzes" },
  { href: "/activities", label: "Activities" },
  { href: "/news", label: "News" },
  { href: "/notifications", label: "Notifications" },
  { href: "/reports", label: "Reports" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOutUser } = useAuth();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <p className="font-semibold">St. Paul the Apostle</p>
        <p className="text-xs text-gray-500">{profile?.fullName ?? profile?.email}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block rounded-lg px-3 py-2 text-sm font-medium transition",
              pathname === item.href
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <button
          onClick={() => signOutUser()}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
