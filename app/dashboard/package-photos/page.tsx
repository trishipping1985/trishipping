"use client";

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useState } from "react";


type PackageRow = {
  id: string;
  user_id: string | null;
  tracking_code: string;
  status: string | null;
  photo_count: number | null;
  warehouse_id: string | null;
  customer_name?: string;
  customer_email?: string;
};

type PackagePhotoRow = {
  id: string;
  package_id: string;
};

type UserRow = {
  id: string;
  role: string | null;
  warehouse_id: string | null;
  full_name?: string | null;
  email?: string | null;
};

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function normalizeStatus(status: string | null) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

function badgeClasses(status: string | null) {
  const s = normalizeStatus(status);

  if (s === "RECEIVED") {
    return "border-yellow-400/30 bg-yellow-500/15 text-yellow-300";
  }

  if (s === "IN TRANSIT") {
    return "border-sky-400/30 bg-sky-500/15 text-sky-300";
  }

  if (s === "OUT FOR DELIVERY") {
    return "border-orange-400/30 bg-orange-500/15 text-orange-300";
  }

  if (s === "DELIVERED") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  }

  return "border-white/10 bg-black/20 text-white/80";
}

export default function PackagePhotosPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canManagePackages, setCanManagePackages] = useState(false);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPackages() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError(authError?.message || "User not found");
        setPackages([]);
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
        setPackages([]);
        setLoading(false);
        return;
      }

      const role = normalizeRole((currentUser as UserRow | null)?.role);
      const warehouseId = (currentUser as UserRow | null)?.warehouse_id || null;

      const adminMode = role === "admin" || role === "owner";
      const warehouseStaffMode =
        role === "staff" || role === "staff2" || role === "staff4";

      setIsAdmin(adminMode);
      setCanManagePackages(adminMode || warehouseStaffMode);
      setCurrentWarehouseId(warehouseId);

      let rows: PackageRow[] = [];

      if (adminMode) {
        const { data, error } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, photo_count, warehouse_id")
          .order("created_at", { ascending: false });

        if (error) {
          setError(error.message);
          setPackages([]);
          setLoading(false);
          return;
        }

        rows = (data || []) as PackageRow[];
      } else if (warehouseStaffMode && warehouseId) {
        const { data, error } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, photo_count, warehouse_id")
          .eq("warehouse_id", warehouseId)
          .order("created_at", { ascending: false });

        if (error) {
          setError(error.message);
          setPackages([]);
          setLoading(false);
          return;
        }

        rows = (data || []) as PackageRow[];
      } else {
        const { data, error } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, photo_count, warehouse_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          setError(error.message);
          setPackages([]);
          setLoading(false);
          return;
        }

        rows = (data || []) as PackageRow[];
      }

      const packageIds = rows.map((pkg) => pkg.id).filter(Boolean);
      const userIds = Array.from(
        new Set(
          rows
            .map((pkg) => pkg.user_id)
            .filter((value): value is string => Boolean(value))
        )
      );

      let userMap: Record<
        string,
        {
          full_name?: string | null;
          email?: string | null;
        }
      > = {};

      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);

        if (!usersError) {
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
      }

      if (packageIds.length > 0) {
        const { data: photoRows, error: photoError } = await supabase
          .from("package_photos")
          .select("id, package_id")
          .in("package_id", packageIds);

        if (!photoError) {
          const countMap: Record<string, number> = {};

          ((photoRows || []) as PackagePhotoRow[]).forEach((row) => {
            countMap[row.package_id] = (countMap[row.package_id] || 0) + 1;
          });

          rows = rows
            .map((pkg) => {
              const matchedUser = pkg.user_id ? userMap[pkg.user_id] : null;
              return {
                ...pkg,
                photo_count: countMap[pkg.id] || 0,
                customer_name:
                  matchedUser?.full_name ||
                  matchedUser?.email ||
                  "Unknown Client",
                customer_email: matchedUser?.email || "",
              };
            })
            .filter((pkg) => (pkg.photo_count || 0) > 0);
        } else {
          rows = rows
            .map((pkg) => {
              const matchedUser = pkg.user_id ? userMap[pkg.user_id] : null;
              return {
                ...pkg,
                customer_name:
                  matchedUser?.full_name ||
                  matchedUser?.email ||
                  "Unknown Client",
                customer_email: matchedUser?.email || "",
              };
            })
            .filter((pkg) => (pkg.photo_count || 0) > 0);
        }
      } else {
        rows = [];
      }

      setPackages(rows);
      setLoading(false);
    }

    loadPackages();
  }, []);

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-20 top-0 h-36 w-36 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-52 sm:w-52 lg:h-56 lg:w-56" />

          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                Package Photos
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                Photo Gallery
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                {isAdmin
                  ? "View package photos across all warehouses."
                  : canManagePackages
                  ? `View package photos for warehouse ${currentWarehouseId || "-"}.`
                  : "View your own package photos."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                Packages With Photos
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {loading ? "Loading" : packages.length}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300 sm:mt-5">
            {error}
          </div>
        ) : null}

        <section className="mt-4 rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px]">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-white/55">
              Loading package photos...
            </div>
          ) : packages.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mb-4 inline-flex rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#F5C84B]">
                No Photos
              </div>
              <p className="text-sm text-white/60">
                No packages with photos found.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-white/10 px-4 py-3 text-[11px] font-semibold text-white/50 sm:px-6">
                Swipe sideways to see all columns
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[640px] w-full border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/10">
                      <th className="w-[110px] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 sm:w-[130px] sm:px-5 sm:py-4 sm:text-[11px] sm:tracking-[0.24em]">
                        Tracking
                      </th>
                      <th className="w-[180px] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 sm:w-[240px] sm:px-5 sm:py-4 sm:text-[11px] sm:tracking-[0.24em]">
                        Client
                      </th>
                      <th className="w-[110px] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 sm:w-[130px] sm:px-5 sm:py-4 sm:text-[11px] sm:tracking-[0.24em]">
                        Status
                      </th>
                      <th className="w-[70px] px-3 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 sm:w-[90px] sm:px-5 sm:py-4 sm:text-[11px] sm:tracking-[0.24em]">
                        Photos
                      </th>
                      <th className="w-[120px] px-3 py-3 text-right text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 sm:w-[150px] sm:px-5 sm:py-4 sm:text-[11px] sm:tracking-[0.24em]">
                        Open
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {packages.map((pkg, index) => (
                      <tr
                        key={pkg.id}
                        className={`border-b border-white/5 transition hover:bg-white/[0.04] ${
                          index % 2 === 0 ? "bg-transparent" : "bg-black/10"
                        }`}
                      >
                        <td className="px-3 py-4 align-top sm:px-5 sm:py-5">
                          <div className="break-all text-sm font-extrabold tracking-wide text-[#F5C84B] sm:text-base">
                            {pkg.tracking_code}
                          </div>
                        </td>

                        <td className="px-3 py-4 align-top sm:px-5 sm:py-5">
                          <div className="break-words text-sm font-semibold leading-5 text-white sm:text-base">
                            {pkg.customer_name || "Unknown Client"}
                          </div>
                          {pkg.customer_email ? (
                            <div className="mt-1 break-all text-[11px] leading-4 text-white/50 sm:text-xs">
                              {pkg.customer_email}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-3 py-4 align-top sm:px-5 sm:py-5">
                          <span
                            className={`inline-flex max-w-full rounded-full border px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] ${badgeClasses(
                              pkg.status
                            )}`}
                          >
                            {normalizeStatus(pkg.status) || "NOT SET"}
                          </span>
                        </td>

                        <td className="px-3 py-4 align-top sm:px-5 sm:py-5">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-bold text-white/85 sm:min-w-10 sm:px-3 sm:py-1.5 sm:text-xs">
                            {pkg.photo_count ?? 0}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-right align-top sm:px-5 sm:py-5">
                          <Link
                            href={`/dashboard/tracking/${encodeURIComponent(
                              pkg.tracking_code
                            )}/photos`}
                            className="inline-flex items-center rounded-xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-3 py-2 text-[11px] font-bold text-[#F5C84B] transition hover:bg-[#F5C84B]/20 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}