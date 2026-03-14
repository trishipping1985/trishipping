"use client";

import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
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

      if (userRow?.full_name) setUserName(userRow.full_name);
      if (userRow?.role) setRole(userRow.role);
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen bg-[#071427] text-white">
      <aside className="flex w-72 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl">
        <div>
          <div className="mb-10">
            <div className="flex items-center gap-4">
              <div className="flex h-[96px] w-[96px] items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <Image
                  src="/LOGOTRI.jpeg"
                  alt="TRI Shipping logo"
                  width={200}
                  height={200}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div>
                <div className="inline-flex items-center rounded-full border border-[#F5C84B]/25 bg-[#F5C84B]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#F5C84B]">
                  TRI Shipping
                </div>

                <div className="mt-2 text-xl font-black text-white">
                  Dashboard
                </div>

                <div className="text-sm text-white/60">
                  Logistics Control Center
                </div>
              </div>
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
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#071427]/80 px-8 py-5 backdrop-blur-xl">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              TRI Shipping
            </div>

            <div className="mt-1 text-lg font-bold text-white md:text-xl">
              Premium Logistics Control Center
            </div>
          </div>

          <div className="flex items-center gap-4">
            {role && (
              <div className="rounded-full border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#F5C84B]">
                {role}
              </div>
            )}

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
              {userName}
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 p-2">
              <NotificationBell />
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
