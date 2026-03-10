"use client";

import { ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminNavLink from "@/components/AdminNavLink";

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
    <div className="flex min-h-screen bg-[#071427] text-white">
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <div className="mb-8">
            <div className="text-yellow-400 text-lg font-bold">
              TRI Shipping
            </div>
            <div className="text-white/60 text-sm">
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

        <button
          onClick={handleLogout}
          className="w-full rounded bg-[#374151] py-2 hover:bg-[#4b5563]"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
