"use client";

import { ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminNavLink from "@/components/AdminNavLink";
import NotificationBell from "@/components/NotificationBell";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

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
    <div className="min-h-screen flex bg-[#071427] text-white">
      <aside className="w-64 p-6 border-r border-white/10 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <div className="text-yellow-400 font-bold text-lg">
              TRI Shipping
            </div>
            <div className="text-sm text-white/60">
              Client Dashboard
            </div>
          </div>

          <nav className="flex flex-col gap-3">
            <AdminNavLink href="/dashboard" label="Overview" />
            <AdminNavLink href="/dashboard/packages" label="Packages" />
            <AdminNavLink href="/dashboard/tracking" label="Tracking" />
            <AdminNavLink href="/dashboard/profile" label="Profile" />
            <AdminNavLink href="/dashboard/update-status" label="Update Status" />
            <AdminNavLink href="/dashboard/notifications" label="Notifications" />
          </nav>
        </div>

        <div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded bg-[#374151] hover:bg-[#4b5563]"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex justify-end items-center p-6 border-b border-white/10">
          <NotificationBell />
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
