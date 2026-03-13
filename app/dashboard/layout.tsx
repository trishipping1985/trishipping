"use client";

import { ReactNode, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminNavLink from "@/components/AdminNavLink";
import NotificationBell from "@/components/NotificationBell";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type UserRow = {
  id: string;
  full_name: string | null;
  role: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [userName, setUserName] = useState<string>("User");
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      const userRow = data as UserRow | null;

      if (userRow?.full_name) {
        setUserName(userRow.full_name);
      }

      if (userRow?.role) {
        setRole(userRow.role);
      }
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex bg-[#071427] text-white">

      {/* SIDEBAR */}

      <aside className="w-72 border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl flex flex-col justify-between">

        <div>

          {/* BRAND */}

          <div className="mb-10">
            <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5C84B]">
              TRI Shipping
            </div>

            <div className="mt-3 text-2xl font-black text-white">
              Dashboard
            </div>

            <div className="text-sm text-white/60">
              Logistics Control Center
            </div>
          </div>

          {/* NAVIGATION */}

          <nav className="flex flex-col gap-3">
            <AdminNavLink href="/dashboard" label="Overview" />
            <AdminNavLink href="/dashboard/packages" label="Packages" />
            <AdminNavLink href="/dashboard/tracking" label="Tracking" />
            <AdminNavLink href="/dashboard/profile" label="Profile" />
            <AdminNavLink href="/dashboard/update-status" label="Update Status" />
            <AdminNavLink href="/dashboard/notifications" label="Notifications" />
          </nav>

        </div>

        {/* LOGOUT */}

        <div className="pt-6 border-t border-white/10">

          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-[#F5C84B]/30 hover:bg-[#F5C84B]/10 hover:text-[#F5C84B]"
          >
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}

      <div className="flex-1 flex flex-col">

        {/* HEADER */}

        <header className="flex items-center justify-between border-b border-white/10 bg-[#071427]/80 px-8 py-5 backdrop-blur-xl">

          {/* LEFT SIDE */}

          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              TRI Shipping
            </div>

            <div className="text-lg font-bold text-white">
              Premium Logistics Control Center
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-4">

            {role && (
              <div className="rounded-full border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F5C84B]">
                {role}
              </div>
            )}

            <div className="text-sm font-semibold text-white">
              {userName}
            </div>

            <NotificationBell />

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="flex-1 p-8">
          {children}
        </main>

      </div>

    </div>
  );
}
