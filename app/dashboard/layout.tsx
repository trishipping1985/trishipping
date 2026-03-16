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
      <aside className="flex w-72 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl">
        <div>
          {/* LOGO AREA */}
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
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col">
        {/* HEADER */}
        <header className="relative z-50 flex items-center justify-between border-b border-white/10 bg-[#071427]/80 px-8 py-5 backdrop-blur-xl">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              TRI Shipping
            </div>

            <div className="mt-1 text-lg font-bold text-white md:text-xl">
              Premium Logistics Control Center
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* NOTIFICATION BELL */}
            <NotificationBell />

            {/* USER DROPDOWN */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
              >
                <span className="max-w-[140px] truncate">{userName}</span>
                <span className="text-white/60">▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[999] w-56 rounded-2xl border border-white/10 bg-[#0D172B] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  <div className="border-b border-white/10 px-4 py-4">
                    <div className="text-sm font-bold text-white">
                      {userName}
                    </div>

                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full border border-[#F5C84B]/25 bg-[#F5C84B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#F5C84B]">
                        {formattedRole}
                      </span>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
