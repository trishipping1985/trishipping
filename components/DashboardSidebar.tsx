"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [canViewCustomers, setCanViewCustomers] = useState(false);
  const [canManagePackages, setCanManagePackages] = useState(false);

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCanViewCustomers(false);
        setCanManagePackages(false);
        return;
      }

      let role = "client";

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (userData?.role) {
        role = normalizeRole(userData.role);
      } else {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        role = normalizeRole(profileData?.role);
      }

      const staffAllowed =
        role === "admin" ||
        role === "owner" ||
        role === "staff" ||
        role === "staff2" ||
        role === "staff4";

      setCanViewCustomers(staffAllowed);
      setCanManagePackages(staffAllowed);
    }

    loadRole();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const linkClass = (path: string) =>
    `block rounded-xl px-4 py-3 transition ${
      isActive(path)
        ? "bg-[#F5C84B] font-semibold text-black"
        : "text-white/80 hover:bg-white/10"
    }`;

  return (
    <aside className="min-h-screen w-64 border-r border-white/10 bg-[#071427] p-6">
      <div className="mb-8">
        <div className="text-2xl font-bold text-[#F5C84B]">TRI Shipping</div>
        <div className="text-sm text-white/60">Client Dashboard</div>
      </div>

      <nav className="space-y-2">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Overview
        </Link>

        <Link
          href="/dashboard/packages"
          className={linkClass("/dashboard/packages")}
        >
          Packages
        </Link>

        {!canManagePackages ? (
          <Link
            href="/dashboard/expected-packages"
            className={linkClass("/dashboard/expected-packages")}
          >
            Expected Packages
          </Link>
        ) : null}

        {canManagePackages ? (
          <Link href="/admin/packages" className={linkClass("/admin/packages")}>
            Incoming Packages
          </Link>
        ) : null}

        <Link
          href="/dashboard/tracking"
          className={linkClass("/dashboard/tracking")}
        >
          Tracking
        </Link>

        <Link
          href="/dashboard/package-photos"
          className={linkClass("/dashboard/package-photos")}
        >
          Package Photos
        </Link>

        {canViewCustomers ? (
          <Link
            href="/dashboard/customers"
            className={linkClass("/dashboard/customers")}
          >
            Customers
          </Link>
        ) : null}

        <Link
          href="/dashboard/profile"
          className={linkClass("/dashboard/profile")}
        >
          Profile
        </Link>

        {canManagePackages ? (
          <Link
            href="/dashboard/update-status"
            className={linkClass("/dashboard/update-status")}
          >
            Update Status
          </Link>
        ) : null}

        <Link
          href="/dashboard/notifications"
          className={linkClass("/dashboard/notifications")}
        >
          Notifications
        </Link>
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-10 w-full rounded-xl bg-white/10 py-3 text-white transition hover:bg-white/20"
      >
        Logout
      </button>
    </aside>
  );
}