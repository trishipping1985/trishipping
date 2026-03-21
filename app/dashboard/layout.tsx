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

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [userName, setUserName] = useState<string>("User");
  const [userRole, setUserRole] = useState<string>("Admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [canViewCustomers, setCanViewCustomers] = useState(false);
  const [canManageShipments, setCanManageShipments] = useState(false);

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

      const role = normalizeRole(userRow?.role);

      const staffAllowed =
        role === "admin" ||
        role === "owner" ||
        role === "staff" ||
        role === "staff2" ||
        role === "staff4";

      setCanViewCustomers(staffAllowed);
      setCanManageShipments(staffAllowed);
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
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-72 flex-col border-r border-white/10 bg-[#071427] p-5 transition-transform duration-300 sm:w-72 lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:p-6 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/40">
            Navigation
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="mb-8 lg:mb-10">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white shadow-xl sm:h-[88px] sm:w-[88px]">
              <Image
                src="/LOGOTRI.jpeg"
                alt="TRI Shipping logo"
                width={200}
                height={200}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center rounded-full border border-[#F5C84B]/25 bg-[#F5C84B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#F5C84B] sm:px-4 sm:text-[11px] sm:tracking-[0.28em]">
                TRI Shipping
              </div>

              <div className="mt-2 text-lg font-black text-white sm:text-xl">
                Dashboard
              </div>

              <div className="text-xs text-white/50 sm:text-sm">
                Logistics Control Center
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <AdminNavLink
            href="/dashboard"
            label="Overview"
            onClick={() => setSidebarOpen(false)}
          />
          <AdminNavLink
            href="/dashboard/packages"
            label="Packages"
            onClick={() => setSidebarOpen(false)}
          />
          {canViewCustomers ? (
            <AdminNavLink
              href="/dashboard/customers"
              label="Customers"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
          <AdminNavLink
            href="/dashboard/tracking"
            label="Tracking"
            onClick={() => setSidebarOpen(false)}
          />
          <AdminNavLink
            href="/dashboard/profile"
            label="Profile"
            onClick={() => setSidebarOpen(false)}
          />
          {canManageShipments ? (
            <AdminNavLink
              href="/dashboard/update-status"
              label="Update Status"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}
          <AdminNavLink
            href="/dashboard/notifications"
            label="Notifications"
            onClick={() => setSidebarOpen(false)}
          />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-40 flex items-center justify-between border-b border-white/10 bg-[#071427]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-10 lg:py-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Open sidebar"
            >
              ☰
            </button>

            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.28em] text-white/40 sm:text-[10px] sm:tracking-[0.35em]">
                TRI Shipping
              </div>

              <div className="mt-1 truncate text-sm font-bold text-white sm:text-base lg:text-xl">
                Premium Logistics Control Center
              </div>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-2 sm:gap-3 lg:gap-6">
            <div className="relative">
              <div className="rounded-xl border border-white/10 bg-white/5 p-1.5 transition hover:bg-white/10 sm:p-2">
                <NotificationBell />
              </div>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex max-w-[170px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold transition hover:bg-white/10 sm:max-w-[220px] sm:gap-3 sm:px-4"
              >
                <span className="max-w-[90px] truncate sm:max-w-[140px]">
                  {userName}
                </span>

                <span className="text-xs text-white/60">▾</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-[9999] w-52 rounded-xl border border-white/10 bg-[#0D172B] shadow-2xl sm:w-56">
                  <div className="border-b border-white/10 px-4 py-4">
                    <div className="truncate text-sm font-bold text-white">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
