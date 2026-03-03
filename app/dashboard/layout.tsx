"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminNavLink from "@/components/AdminNavLink";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

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
              className="px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]"
            >
              Overview
            </Link>

            <Link
              href="/dashboard/packages"
              className="px-4 py-2 rounded bg-[#111827] hover:bg-[#1f2937]"
            >
              Packages
            </Link>

            {/* FIXED ROUTE HERE */}
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
          </nav>
        </div>

        {/* Bottom buttons */}
        <div className="mt-6 flex gap-3">
          <div className="flex-1">
            <AdminNavLink />
          </div>

          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2 rounded bg-[#374151] hover:bg-[#4b5563] font-medium"
          >
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
