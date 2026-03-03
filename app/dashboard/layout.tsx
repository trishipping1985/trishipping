import Link from "next/link";
import { ReactNode } from "react";
import AdminNavLink from "@/components/AdminNavLink";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#0b1220] text-white">
      {/* Sidebar */}
      <aside className="w-64 p-6 border-r border-blue-900 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <div className="text-yellow-400 font-bold text-lg">
              TRI Shipping
            </div>
            <div className="text-sm text-gray-400">
              Client Dashboard
            </div>
          </div>

          <nav className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded bg-yellow-500 text-black font-medium"
            >
              Overview
            </Link>

            <Link
              href="/dashboard/packages"
              className="px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]"
            >
              Packages
            </Link>

            <Link
              href="/dashboard/tracking"
              className="px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]"
            >
              Tracking
            </Link>

            <Link
              href="/dashboard/profile"
              className="px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]"
            >
              Profile
            </Link>

            {/* ADMIN LINK (auto hidden for non-admins) */}
            <AdminNavLink />
          </nav>
        </div>

        <div>
          <button className="w-full mt-6 px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
