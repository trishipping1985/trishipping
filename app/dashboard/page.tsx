"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PushNotificationsButton from "@/components/PushNotificationsButton";
import { supabase } from "@/lib/supabaseClient";

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

  if (value === "SHIPPED") {
    return "border-indigo-400/30 bg-indigo-500/10 text-indigo-300";
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

function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManagePackages, setCanManagePackages] = useState(false);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(
    null
  );

  const [totalPackages, setTotalPackages] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [shippedCount, setShippedCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);

  const [recentPackages, setRecentPackages] = useState<RecentPackageRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        const user = session?.user;

        if (authError || !user) {
          if (isMounted) {
            setError(authError?.message || "User not found");
            setLoading(false);
          }
          return;
        }

        const { data: currentUser, error: currentUserError } = await supabase
          .from("users")
          .select("id, role, warehouse_id")
          .eq("id", user.id)
          .maybeSingle();

        if (currentUserError) {
          if (isMounted) {
            setError(currentUserError.message);
            setLoading(false);
          }
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

        if (isMounted) {
          setIsAdmin(adminMode);
          setCanManagePackages(manageMode);
          setCurrentWarehouseId(warehouseId);
        }

        let packages: PackageRow[] = [];

        if (adminMode) {
          const { data, error: packagesError } = await supabase
            .from("packages")
            .select("id, user_id, status, warehouse_id")
            .order("created_at", { ascending: false });

          if (packagesError) {
            if (isMounted) {
              setError(packagesError.message);
              setLoading(false);
            }
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
            if (isMounted) {
              setError(packagesError.message);
              setLoading(false);
            }
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
            if (isMounted) {
              setError(packagesError.message);
              setLoading(false);
            }
            return;
          }

          packages = (data || []) as PackageRow[];
        }

        const received = packages.filter(
          (pkg) => normalizeStatus(pkg.status) === "RECEIVED"
        ).length;

        const shipped = packages.filter(
          (pkg) => normalizeStatus(pkg.status) === "SHIPPED"
        ).length;

        const inTransit = packages.filter(
          (pkg) => normalizeStatus(pkg.status) === "IN TRANSIT"
        ).length;

        const delivered = packages.filter(
          (pkg) => normalizeStatus(pkg.status) === "DELIVERED"
        ).length;

        if (isMounted) {
          setTotalPackages(packages.length);
          setReceivedCount(received);
          setShippedCount(shipped);
          setInTransitCount(inTransit);
          setDeliveredCount(delivered);
        }

        let recentQuery = supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (!adminMode) {
          if (warehouseStaffMode && warehouseId) {
            recentQuery = supabase
              .from("packages")
              .select("id, user_id, tracking_code, status, created_at")
              .eq("warehouse_id", warehouseId)
              .order("created_at", { ascending: false })
              .limit(5);
          } else {
            recentQuery = supabase
              .from("packages")
              .select("id, user_id, tracking_code, status, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5);
          }
        }

        const { data: recentPackagesRaw, error: recentPackagesError } =
          await recentQuery;

        if (recentPackagesError) {
          if (isMounted) {
            setError(recentPackagesError.message);
            setRecentPackages([]);
            setLoading(false);
          }
          return;
        }

        const recentPackagesList = (recentPackagesRaw ||
          []) as RecentPackageRawRow[];

        const uniqueUserIds = Array.from(
          new Set(
            recentPackagesList
              .map((pkg) => pkg.user_id)
              .filter((value): value is string => Boolean(value))
          )
        );

        let userMap: Record<
          string,
          { full_name?: string | null; email?: string | null }
        > = {};

        if (uniqueUserIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, full_name, email")
            .in("id", uniqueUserIds);

          if (usersError) {
            if (isMounted) {
              setError(usersError.message);
              setRecentPackages([]);
              setLoading(false);
            }
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

        const formattedRecentPackages: RecentPackageRow[] =
          recentPackagesList.map((pkg) => {
            const matchedUser = pkg.user_id ? userMap[pkg.user_id] : null;
            const customerName =
              matchedUser?.full_name || matchedUser?.email || "-";

            return {
              id: pkg.id,
              tracking_code: pkg.tracking_code,
              status: pkg.status,
              created_at: pkg.created_at,
              customer_name: customerName,
            };
          });

        if (isMounted) {
          setRecentPackages(formattedRecentPackages);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);

        if (isMounted) {
          setError("Failed to load dashboard");
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const overviewText = useMemo(() => {
    if (isAdmin) return "Live overview of all shipments across every warehouse.";
    if (canManagePackages) {
      return `Live overview for warehouse ${currentWarehouseId || "-"}.`;
    }
    return "Track your packages, receipts, photos, and shipment progress.";
  }, [isAdmin, canManagePackages, currentWarehouseId]);

  const dashboardScope = isAdmin
    ? "All Warehouses"
    : canManagePackages
    ? "Warehouse View"
    : "My Shipments";

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.32)] sm:rounded-[30px] sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#F5C84B]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 grid gap-4 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:tracking-[0.28em]">
                TRI Shipping Command Center
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Dashboard Overview
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
                {overviewText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <QuickInfoPill label="Scope" value={dashboardScope} />
              <QuickInfoPill label="Status" value={loading ? "Syncing" : "Live"} />
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300 shadow-lg sm:px-5">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
          <QuickActionCard
            href="/dashboard/tracking"
            icon="🔎"
            title="Track"
            subtitle="Find package"
          />
          <QuickActionCard
            href="/dashboard/receipts"
            icon="🧾"
            title="Receipts"
            subtitle="View invoices"
          />
          <QuickActionCard
            href="/dashboard/package-photos"
            icon="📸"
            title="Photos"
            subtitle="Package images"
          />
          <QuickActionCard
            href={canManagePackages ? "/admin/packages" : "/dashboard/expected-packages"}
            icon="📥"
            title="Received"
            subtitle={canManagePackages ? "Warehouse page" : "Expected items"}
          />
        </section>

        <section>
          <PushNotificationsButton />
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5 xl:gap-5">
          <LuxuryStatCard
            title="Total"
            value={loading ? "-" : totalPackages}
            icon="📦"
            subtitle="Shipments in view"
            percent={100}
          />
          <LuxuryStatCard
            title="Received"
            value={loading ? "-" : receivedCount}
            icon="📥"
            subtitle="Logged packages"
            percent={getPercent(receivedCount, totalPackages)}
          />
          <LuxuryStatCard
            title="Shipped"
            value={loading ? "-" : shippedCount}
            icon="✈️"
            subtitle="Sent forward"
            percent={getPercent(shippedCount, totalPackages)}
          />
          <LuxuryStatCard
            title="In Transit"
            value={loading ? "-" : inTransitCount}
            icon="🚚"
            subtitle="Currently moving"
            percent={getPercent(inTransitCount, totalPackages)}
          />
          <LuxuryStatCard
            title="Delivered"
            value={loading ? "-" : deliveredCount}
            icon="✅"
            subtitle="Completed"
            percent={getPercent(deliveredCount, totalPackages)}
            wideOnMobile
          />
        </section>

        <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[30px]">
          <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div>
              <h2 className="text-lg font-black text-white sm:text-2xl">
                Recent Shipments
              </h2>
              <p className="mt-1 text-sm text-white/55">
                Latest movement across your most recent packages.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-[#F5C84B]/15 bg-[#F5C84B]/10 px-3 py-1.5 text-xs font-bold text-[#F5C84B]">
              Latest 5
            </span>
          </div>

          <div className="block md:hidden">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-white/55">
                Loading recent shipments...
              </div>
            ) : recentPackages.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/55">
                No recent shipments found.
              </div>
            ) : (
              <div className="space-y-3 p-3">
                {recentPackages.map((pkg, index) => (
                  <div
                    key={`${pkg.id || index}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                          Tracking
                        </div>
                        <div className="mt-1 break-all text-sm font-extrabold tracking-wide text-[#F5C84B]">
                          {pkg.tracking_code || "-"}
                        </div>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${getStatusPillClasses(
                          pkg.status
                        )}`}
                      >
                        {normalizeStatus(pkg.status) || "UNKNOWN"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileInfo label="Customer" value={pkg.customer_name} />
                      <MobileInfo
                        label="Date"
                        value={formatDate(pkg.created_at)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-white/55"
                    >
                      Loading recent shipments...
                    </td>
                  </tr>
                ) : recentPackages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-white/55"
                    >
                      No recent shipments found.
                    </td>
                  </tr>
                ) : (
                  recentPackages.map((pkg, index) => (
                    <tr
                      key={`${pkg.id || index}`}
                      className="border-b border-white/5 transition hover:bg-white/[0.045]"
                    >
                      <td className="px-6 py-5">
                        <div className="text-base font-extrabold tracking-wide text-[#F5C84B] lg:text-lg">
                          {pkg.tracking_code || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ${getStatusPillClasses(
                            pkg.status
                          )}`}
                        >
                          {normalizeStatus(pkg.status) || "UNKNOWN"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-base text-white/85">
                        {pkg.customer_name}
                      </td>

                      <td className="px-6 py-5 text-base text-white/65">
                        {formatDate(pkg.created_at)}
                      </td>
                    </tr>
                  ))
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-xl sm:px-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 sm:tracking-[0.24em]">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-[#F5C84B]/25 hover:bg-white/[0.065] sm:p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 text-lg transition group-hover:scale-105">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-black text-white sm:text-base">
            {title}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/50">
            {subtitle}
          </div>
        </div>
      </div>
    </Link>
  );
}

function LuxuryStatCard({
  title,
  value,
  icon,
  subtitle,
  percent,
  wideOnMobile = false,
}: {
  title: string;
  value: string | number;
  icon: string;
  subtitle: string;
  percent: number;
  wideOnMobile?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#F5C84B]/25 sm:rounded-[28px] sm:p-5 ${
        wideOnMobile ? "col-span-2 xl:col-span-1" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.12),transparent_35%)] opacity-80" />
      <div className="absolute -right-8 top-0 h-20 w-20 rounded-full bg-[#F5C84B]/10 blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 sm:text-xs sm:tracking-[0.2em]">
              {title}
            </p>
            <p className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              {value}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 text-lg shadow-lg transition duration-300 group-hover:scale-105 sm:h-12 sm:w-12 sm:text-xl">
            {icon}
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-white/55 sm:text-sm">
          {subtitle}
        </p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#F5C84B]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MobileInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className="mt-1 truncate text-sm text-white/80">{value}</div>
    </div>
  );
}