"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type UserRow = {
  id: string;
  role: string | null;
  warehouse_id: string | null;
  full_name?: string | null;
  email?: string | null;
};

type PackageRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  warehouse_id: string | null;
};

type RecentPackageRawRow = {
  id: string;
  user_id: string | null;
  tracking_code: string | null;
  status: string | null;
  created_at: string | null;
};

type RecentPackageRow = {
  id: string;
  tracking_code: string | null;
  status: string | null;
  created_at: string | null;
  customer_name: string;
};

function normalizeStatus(status: string | null) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManagePackages, setCanManagePackages] = useState(false);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(null);

  const [totalPackages, setTotalPackages] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);

  const [recentPackages, setRecentPackages] = useState<RecentPackageRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError(authError?.message || "User not found");
          setLoading(false);
          return;
        }

        const { data: currentUser } = await supabase
          .from("users")
          .select("id, role, warehouse_id")
          .eq("id", user.id)
          .maybeSingle();

        const userRow = currentUser as UserRow | null;

        const role = String(userRow?.role || "").trim().toLowerCase();

        const adminMode = role === "admin" || role === "owner";
        const warehouseStaffMode =
          role === "staff" || role === "staff2" || role === "staff4";

        const manageMode = adminMode || warehouseStaffMode;
        const warehouseId = userRow?.warehouse_id || null;

        setIsAdmin(adminMode);
        setCanManagePackages(manageMode);
        setCurrentWarehouseId(warehouseId);

        let packages: PackageRow[] = [];

        if (adminMode) {
          const { data } = await supabase
            .from("packages")
            .select("id, user_id, status, warehouse_id");

          packages = (data || []) as PackageRow[];
        } else if (warehouseStaffMode && warehouseId) {
          const { data } = await supabase
            .from("packages")
            .select("id, user_id, status, warehouse_id")
            .eq("warehouse_id", warehouseId);

          packages = (data || []) as PackageRow[];
        } else {
          const { data } = await supabase
            .from("packages")
            .select("id, user_id, status, warehouse_id")
            .eq("user_id", user.id);

          packages = (data || []) as PackageRow[];
        }

        setTotalPackages(packages.length);

        setReceivedCount(
          packages.filter(
            (p) => normalizeStatus(p.status) === "RECEIVED"
          ).length
        );

        setInTransitCount(
          packages.filter(
            (p) => normalizeStatus(p.status) === "IN TRANSIT"
          ).length
        );

        setDeliveredCount(
          packages.filter(
            (p) => normalizeStatus(p.status) === "DELIVERED"
          ).length
        );

        const { data: recentPackagesRaw } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        const recentList = (recentPackagesRaw || []) as RecentPackageRawRow[];

        const userIds = Array.from(
          new Set(
            recentList
              .map((pkg) => pkg.user_id)
              .filter((v): v is string => Boolean(v))
          )
        );

        let userMap: Record<string, { full_name?: string | null; email?: string | null }> = {};

        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, full_name, email")
            .in("id", userIds);

          userMap = Object.fromEntries(
            ((usersData || []) as UserRow[]).map((u) => [
              u.id,
              { full_name: u.full_name, email: u.email },
            ])
          );
        }

        const formatted = recentList.map((pkg) => {
          const user = pkg.user_id ? userMap[pkg.user_id] : null;

          return {
            id: pkg.id,
            tracking_code: pkg.tracking_code,
            status: pkg.status,
            created_at: pkg.created_at,
            customer_name:
              user?.full_name || user?.email || "-",
          };
        });

        setRecentPackages(formatted);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const overviewText = useMemo(() => {
    if (isAdmin) return "Overview of all shipments across warehouses.";
    if (canManagePackages)
      return `Overview of shipments for warehouse ${currentWarehouseId || "-"}.`;
    return "Overview of your shipment activity.";
  }, [isAdmin, canManagePackages, currentWarehouseId]);

  return (
    <main className="min-h-screen bg-[#071427] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">
            Dashboard Overview
          </h1>
          <p className="mt-3 text-lg text-white/60">{overviewText}</p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {/* STAT CARDS */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

          <StatCard title="Total Packages" value={totalPackages} icon="📦" loading={loading} />
          <StatCard title="Received" value={receivedCount} icon="📥" loading={loading} />
          <StatCard title="In Transit" value={inTransitCount} icon="🚚" loading={loading} />
          <StatCard title="Delivered" value={deliveredCount} icon="✅" loading={loading} />

        </div>

        {/* RECENT SHIPMENTS */}

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-[#F5C84B]">
              Recent Packages
            </h2>

            <span className="rounded-full border border-white/10 px-4 py-1 text-sm text-white/60">
              Latest 5
            </span>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="text-xs uppercase tracking-widest text-white/40">
                <tr className="border-b border-white/10">
                  <th className="py-4">Tracking</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-white/50">
                      Loading recent packages...
                    </td>
                  </tr>
                ) : recentPackages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-white/50">
                      No recent packages found.
                    </td>
                  </tr>
                ) : (
                  recentPackages.map((pkg, index) => (
                    <tr
                      key={pkg.id || index}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-5 font-bold text-[#F5C84B] text-xl">
                        {pkg.tracking_code || "-"}
                      </td>

                      <td className="text-white/90">
                        {normalizeStatus(pkg.status)}
                      </td>

                      <td>{pkg.customer_name}</td>

                      <td>{formatDate(pkg.created_at)}</td>
                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>
    </main>
  );
}

/* CARD COMPONENT */

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number;
  icon: string;
  loading: boolean;
}) {
  return (
    <div className="group rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur-lg transition hover:scale-[1.02] hover:border-[#F5C84B]/30">

      <div className="flex items-center justify-between">

        <p className="text-white/70 font-semibold">
          {title}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5C84B]/20 text-xl">
          {icon}
        </div>

      </div>

      <p className="mt-6 text-5xl font-extrabold text-white">
        {loading ? "-" : value}
      </p>

    </div>
  );
}
