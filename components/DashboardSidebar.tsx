"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [canViewCustomers, setCanViewCustomers] = useState(false);
  const [canManagePackages, setCanManagePackages] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRole() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        if (isMounted) {
          setCanViewCustomers(false);
          setCanManagePackages(false);
        }
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

        role = normalizeRole(profileData?.role) || "client";
      }

      const staffAllowed =
        role === "admin" ||
        role === "owner" ||
        role === "staff" ||
        role === "staff2" ||
        role === "staff4";

      if (isMounted) {
        setCanViewCustomers(staffAllowed);
        setCanManagePackages(staffAllowed);
      }
    }

    loadRole();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const linkClass = (path: string) =>
    `block rounded-xl px-4 py-3 text-sm transition sm:text-base ${
      isActive(path)
        ? "bg-[#F5C84B] font-semibold text-black"
        : "text-white/80 hover:bg-white/10"
    }`;

  return (
    <aside className="flex h-dvh w-[min(19rem,86vw)] max-w-[86vw] flex-shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#071427] p-4 sm:w-64 sm:p-6">
      <div className="mb-5 flex-shrink-0 sm:mb-8">
        <div className="text-xl font-bold text-[#F5C84B] sm:text-2xl">
          TRI Shipping
        </div>
        <div className="text-xs text-white/60 sm:text-sm">
          Client Dashboard
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 pb-6">
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
          href="/dashboard/receipts"
          className={linkClass("/dashboard/receipts")}
        >
          Invoices / Receipts
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

        <Link
          href="/privacy-policy"
          className={linkClass("/privacy-policy")}
        >
          Privacy Policy
        </Link>
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex-shrink-0 rounded-xl bg-white/10 py-3 text-sm text-white transition hover:bg-white/20 sm:text-base"
      >
        Logout
      </button>
    </aside>
  );
}