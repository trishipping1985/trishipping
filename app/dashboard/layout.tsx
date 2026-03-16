"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
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
  const [userRole, setUserRole] = useState<string>("Admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      const userRow = data as UserRow | null;

      if (userRow?.full_name) {
        setUserName(userRow.full_name);
      }

      if (userRow?.role) {
        setUserRole(userRow.role);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const formattedRole = userRole ? userRole.toUpperCase() : "ADMIN";

  return (
    <div className="flex min-h-screen bg-[#071427] text-white">
      {/* SIDEBAR */}
      <aside className="flex w-72 flex-col border-r border-white/10 bg-[#071427] p-6">
        {/* LOGO */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-white shadow-xl">
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
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/25 bg-[#F5C84B]/10 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#F5C84B]">
                TRI Shipping
              </div>

              <div className="mt-2 text-xl font-black text-white">
                Dashboard
              </div>

              <div className="text-sm text-white/50">
                Logistics Control Center
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex flex-col gap-2">
          <AdminNavLink href="/dashboard" label="Overview" />
          <AdminNavLink href="/dashboard/packages" label="Packages" />
          <AdminNavLink href="/dashboard/tracking" label="Tracking" />
          <AdminNavLink href="/dashboard/profile" label="Profile" />
          <AdminNavLink href="/dashboard/update-status" label="Update Status" />
          <AdminNavLink href="/dashboard/notifications" label="Notifications" />
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 flex-col">
        {/* HEADER */}
        <header className="relative z-40 flex items-center justify-between border-b border-white/10 bg-[#071427]/70 px-10 py-6 backdrop-blur-xl">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-white/40">
              TRI Shipping
            </div>

            <div className="mt-1 text-xl font-bold text-white">
              Premium Logistics Control Center
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* NOTIFICATIONS */}
            <div className="relative">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 transition hover:bg-white/10">
                <NotificationBell />
              </div>
            </div>

            {/* USER MENU */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
              >
                <span className="max-w-[140px] truncate">{userName}</span>

                <span className="text-xs text-white/60">▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-[9999] w-56 rounded-xl border border-white/10 bg-[#0D172B] shadow-2xl">
                  <div className="border-b border-white/10 px-4 py-4">
                    <div className="text-sm font-bold text-white">
                      {userName}
                    </div>

                    <div className="mt-2">
                      <span className="rounded-full border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#F5C84B]">
                        {formattedRole}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE */}
        <main className="flex-1 p-10">{children}</main>
      </div>
    </div>
  );
}
