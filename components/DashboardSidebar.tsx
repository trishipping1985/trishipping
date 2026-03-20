"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block px-4 py-3 rounded-xl ${
      pathname === path
        ? "bg-[#F5C84B] text-black font-semibold"
        : "text-white/80 hover:bg-white/10"
    }`;

  return (
    <aside className="w-64 min-h-screen bg-[#071427] border-r border-white/10 p-6">
      <div className="mb-8 text-2xl font-bold text-[#F5C84B]">
        TRI Shipping
        <div className="text-sm text-white/60">Client Dashboard</div>
      </div>

      <nav className="space-y-2">
        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Overview
        </Link>

        <Link href="/dashboard/packages" className={linkClass("/dashboard/packages")}>
          Packages
        </Link>

        <Link href="/dashboard/customers" className={linkClass("/dashboard/customers")}>
          Customers
        </Link>

        <Link href="/dashboard/tracking" className={linkClass("/dashboard/tracking")}>
          Tracking
        </Link>

        <Link href="/dashboard/profile" className={linkClass("/dashboard/profile")}>
          Profile
        </Link>

        <Link href="/dashboard/update-status" className={linkClass("/dashboard/update-status")}>
          Update Status
        </Link>

        <Link href="/dashboard/notifications" className={linkClass("/dashboard/notifications")}>
          Notifications
        </Link>
      </nav>

      <button className="mt-10 w-full rounded-xl bg-white/10 py-3 text-white hover:bg-white/20">
        Logout
      </button>
    </aside>
  );
}
