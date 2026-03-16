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

function getStatusPillClasses(status: string | null) {
  const value = normalizeStatus(status);

  if (value === "RECEIVED") {
    return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
  }

  if (value === "IN TRANSIT") {
    return "border-sky-400/30 bg-sky-500/10 text-sky-300";
  }

  if (value === "OUT FOR DELIVERY") {
    return "border-orange-400/30 bg-orange-500/10 text-orange-300";
  }

  if (value === "DELIVERED") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  return "border-white/10 bg-white/5 text-white/70";
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

        const { data: currentUser, error: currentUserError } = await supabase
          .from("users")
          .select("id, role, warehouse_id")
          .eq("id", user.id)
          .maybeSingle();

        if (currentUserError) {
          setError(currentUserError.message);
          setLoading(false);
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
            setError(packagesError.message);
            setLoading(false);
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
            setError(packagesError.message);
            setLoading(false);
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
            setError(packagesError.message);
            setLoading(false);
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

        const { data: recentPackagesRaw, error: recentPackagesError } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentPackagesError) {
          setError(recentPackagesError.message);
          setRecentPackages([]);
          setLoading(false);
          return;
        }

        const recentPackagesList = (recentPackagesRaw || []) as RecentPackageRawRow[];

        const uniqueUserIds = Array.from(
          new Set(
            recentPackagesList
              .map((pkg) => pkg.user_id)
              .filter((value): value is string => Boolean(value))
          )
        );

        let userMap: Record<string, { full_name?: string | null; email?: string | null }> = {};

        if (uniqueUserIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, full_name, email")
            .in("id", uniqueUserIds);

          if (usersError) {
            setError(usersError.message);
            setRecentPackages([]);
            setLoading(false);
            return;
          }

          userMap = Object.fromEntries(
            ((usersData || []) as UserRow[]).map((u) => [
              u.id,
              {
                full_name: u.full_name || null,
                email: u.email || null,
              },
            ])
          );
        }

        const formattedRecentPackages: RecentPackageRow[] = recentPackagesList.map((pkg) => {
          const matchedUser = pkg.user_id ? userMap[pkg.user_id] : null;
          const customerName = matchedUser?.full_name || matchedUser?.email || "-";

          return {
            id: pkg.id,
            tracking_code: pkg.tracking_code,
            status: pkg.status,
            created_at: pkg.created_at,
            customer_name: customerName,
          };
        });

        setRecentPackages(formattedRecentPackages);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Failed to load dashboard");
        setLoading(false);
      }
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
    <main className="min-h-screen bg-[#071427] px-4 py-8 text-white md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-20 top-0 h-60 w-60 rounded-full bg-[#F5C84B]/10 blur-3xl" />
          <div className="absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5C84B]">
                TRI Shipping Command Center
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">
                Dashboard Overview
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                {overviewText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <QuickInfoPill label="Scope" value={isAdmin ? "All Warehouses" : canManagePackages ? "Warehouse View" : "Personal View"} />
              <QuickInfoPill label="Status" value={loading ? "Loading" : "Live"} />
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300 shadow-lg">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <LuxuryStatCard
            title="Total Packages"
            value={loading ? "-" : totalPackages}
            icon="📦"
            subtitle="All shipments in your view"
          />
          <LuxuryStatCard
            title="Received"
            value={loading ? "-" : receivedCount}
            icon="📥"
            subtitle="Successfully logged in"
          />
          <LuxuryStatCard
            title="In Transit"
            value={loading ? "-" : inTransitCount}
            icon="🚚"
            subtitle="Currently moving"
          />
          <LuxuryStatCard
            title="Delivered"
            value={loading ? "-" : deliveredCount}
            icon="✅"
            subtitle="Completed shipments"
          />
        </section>

        <section className="mt-10 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#F5C84B] sm:text-3xl">
                Recent Packages
              </h2>
              <p className="mt-2 text-sm text-white/55">
                Latest movement across your most recent shipments.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-[#F5C84B]/15 bg-[#F5C84B]/10 px-4 py-2 text-sm font-semibold text-[#F5C84B]">
              Latest 5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/10">
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                    Tracking
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-white/55">
                      Loading recent packages...
                    </td>
                  </tr>
                ) : recentPackages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-white/55">
                      No recent packages found.
                    </td>
                  </tr>
                ) : (
                  recentPackages.map((pkg, index) => {
                    return (
                      <tr
                        key={`${pkg.id || index}`}
                        className="border-b border-white/5 transition hover:bg-white/[0.045]"
                      >
                        <td className="px-6 py-5">
                          <div className="font-extrabold tracking-wide text-[#F5C84B] sm:text-lg">
                            {pkg.tracking_code || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ${getStatusPillClasses(
                              pkg.status
                            )}`}
                          >
                            {normalizeStatus(pkg.status)}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-white/85 sm:text-base">
                          {pkg.customer_name}
                        </td>

                        <td className="px-6 py-5 text-sm text-white/65 sm:text-base">
                          {formatDate(pkg.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickInfoPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function LuxuryStatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: string;
  subtitle: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#F5C84B]/25 hover:shadow-[0_28px_70px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.12),transparent_35%)] opacity-80" />
      <div className="absolute -right-8 top-0 h-24 w-24 rounded-full bg-[#F5C84B]/8 blur-2xl transition duration-300 group-hover:bg-[#F5C84B]/12" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
              {title}
            </p>
            <p className="mt-5 text-5xl font-black tracking-tight text-white">
              {value}
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 text-2xl shadow-lg transition duration-300 group-hover:scale-105 group-hover:border-[#F5C84B]/30">
            {icon}
          </div>
        </div>

        <p className="mt-6 text-sm text-white/55">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
