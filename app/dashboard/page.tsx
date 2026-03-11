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
};

type PackageRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  warehouse_id: string | null;
};

type RecentPackageRow = {
  tracking_code: string;
  status: string | null;
  customer_name?: string | null;
  full_name?: string | null;
  created_at: string | null;
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
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoading(false);
        setError(authError?.message || "User not found");
        return;
      }

      const { data: currentUser, error: currentUserError } = await supabase
        .from("users")
        .select("id, role, warehouse_id")
        .eq("id", user.id)
        .maybeSingle();

      if (currentUserError) {
        setLoading(false);
        setError(currentUserError.message);
        return;
      }

      const userRow = currentUser as UserRow | null;
      const role = String(userRow?.role || "")
        .trim()
        .toLowerCase();

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
        const { data, error: packagesError } = await supabase
          .from("packages")
          .select("id, user_id, status, warehouse_id")
          .order("created_at", { ascending: false });

        if (packagesError) {
          setLoading(false);
          setError(packagesError.message);
          return;
        }

        packages = (data || []) as PackageRow[];
      } else if (warehouseStaffMode && warehouseId) {
        const { data, error: packagesError } = await supabase
          .from("packages")
          .select("id, user_id, status, warehouse_id")
          .eq("warehouse_id", warehouseId)
          .order("created_at", { ascending: false });

        if (packagesError) {
          setLoading(false);
          setError(packagesError.message);
          return;
        }

        packages = (data || []) as PackageRow[];
      } else {
        const { data, error: packagesError } = await supabase
          .from("packages")
          .select("id, user_id, status, warehouse_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (packagesError) {
          setLoading(false);
          setError(packagesError.message);
          return;
        }

        packages = (data || []) as PackageRow[];
      }

      setTotalPackages(packages.length);

      const received = packages.filter(
        (pkg) => normalizeStatus(pkg.status) === "RECEIVED"
      ).length;

      const inTransit = packages.filter(
        (pkg) => normalizeStatus(pkg.status) === "IN TRANSIT"
      ).length;

      const delivered = packages.filter(
        (pkg) => normalizeStatus(pkg.status) === "DELIVERED"
      ).length;

      setReceivedCount(received);
      setInTransitCount(inTransit);
      setDeliveredCount(delivered);

      const recentRes = await fetch("/api/recent-packages", {
        cache: "no-store",
      });

      if (!recentRes.ok) {
        setLoading(false);
        setError("Failed to load recent packages");
        return;
      }

      const recentData = await recentRes.json();

      if (Array.isArray(recentData)) {
        setRecentPackages(recentData as RecentPackageRow[]);
      } else if (Array.isArray(recentData?.data)) {
        setRecentPackages(recentData.data as RecentPackageRow[]);
      } else {
        setRecentPackages([]);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  const overviewText = useMemo(() => {
    if (isAdmin) return "Overview of all shipments across warehouses.";
    if (canManagePackages) {
      return `Overview of shipments for warehouse ${currentWarehouseId || "-"}.`;
    }
    return "Overview of your shipment activity.";
  }, [isAdmin, canManagePackages, currentWarehouseId]);

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Overview</h1>
          <p className="mt-3 text-lg text-white/70">{overviewText}</p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-white/85">Packages</p>
              <span className="text-3xl">📦</span>
            </div>
            <p className="mt-6 text-6xl font-extrabold text-white">
              {loading ? "-" : totalPackages}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-white/85">Received</p>
              <span className="text-3xl">📥</span>
            </div>
            <p className="mt-6 text-6xl font-extrabold text-white">
              {loading ? "-" : receivedCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-white/85">In Transit</p>
              <span className="text-3xl">🚚</span>
            </div>
            <p className="mt-6 text-6xl font-extrabold text-white">
              {loading ? "-" : inTransitCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-white/85">Delivered</p>
              <span className="text-3xl">✅</span>
            </div>
            <p className="mt-6 text-6xl font-extrabold text-white">
              {loading ? "-" : deliveredCount}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-4xl font-extrabold text-[#F5C84B]">
              Recent Packages
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              Latest 5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.25em] text-[#F5C84B]">
                    Tracking
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.25em] text-[#F5C84B]">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.25em] text-[#F5C84B]">
                    Customer
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.25em] text-[#F5C84B]">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-white/60"
                    >
                      Loading recent packages...
                    </td>
                  </tr>
                ) : recentPackages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-white/60"
                    >
                      No recent packages found.
                    </td>
                  </tr>
                ) : (
                  recentPackages.map((pkg, index) => {
                    const customerName =
                      pkg.customer_name || pkg.full_name || "-";

                    return (
                      <tr
                        key={`${pkg.tracking_code}-${index}`}
                        className="border-b border-white/5 last:border-b-0"
                      >
                        <td className="px-4 py-5 text-3xl font-extrabold text-[#F5C84B]">
                          {pkg.tracking_code}
                        </td>
                        <td className="px-4 py-5 text-lg font-semibold text-white">
                          {normalizeStatus(pkg.status)}
                        </td>
                        <td className="px-4 py-5 text-lg text-white">
                          {customerName}
                        </td>
                        <td className="px-4 py-5 text-lg text-white">
                          {formatDate(pkg.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
