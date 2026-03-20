"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type PackageRow = {
  id: string;
  user_id: string | null;
  tracking_code: string;
  status: string | null;
  weight_kg: number | null;
  photo_count: number | null;
  warehouse_id: string | null;
};

type UserRow = {
  id: string;
  role: string | null;
  warehouse_id: string | null;
};

const BULK_STATUS_OPTIONS = [
  "RECEIVED",
  "IN TRANSIT",
  "OUT FOR DELIVERY",
  "DELIVERED",
] as const;

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

function LoadingRows({ canManagePackages }: { canManagePackages: boolean }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-[760px] border-collapse lg:min-w-full">
        <thead>
          <tr className="border-b border-white/10 bg-black/10">
            {canManagePackages ? (
              <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
                Select
              </th>
            ) : null}
            <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
              Tracking Code
            </th>
            <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
              Status
            </th>
            <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
              Weight
            </th>
            <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
              Photos
            </th>
            <th className="px-4 py-4 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
              View
            </th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b border-white/5">
              {canManagePackages ? (
                <td className="px-4 py-4 sm:px-6 sm:py-5">
                  <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
                </td>
              ) : null}

              <td className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="h-5 w-28 animate-pulse rounded bg-[#F5C84B]/15" />
              </td>
              <td className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
              </td>
              <td className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="h-5 w-20 animate-pulse rounded bg-white/10" />
              </td>
              <td className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="h-5 w-10 animate-pulse rounded bg-white/10" />
              </td>
              <td className="px-4 py-4 text-right sm:px-6 sm:py-5">
                <div className="ml-auto h-9 w-28 animate-pulse rounded-2xl bg-white/10" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className="mt-1 text-sm text-white/80">{value}</div>
    </div>
  );
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [canManagePackages, setCanManagePackages] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageRow | null>(null);

  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  async function loadPage() {
    setLoading(true);
    setActionMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPackages([]);
      setIsAdmin(false);
      setCanManagePackages(false);
      setCurrentWarehouseId(null);
      setSelectedPackage(null);
      setSelectedPackageIds([]);
      setLoading(false);
      return;
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("id, role, warehouse_id")
      .eq("id", user.id)
      .maybeSingle();

    const role = String(((currentUser as UserRow | null)?.role || ""))
      .trim()
      .toLowerCase();

    const warehouseId = (currentUser as UserRow | null)?.warehouse_id || null;

    const adminMode = role === "admin" || role === "owner";
    const warehouseStaffMode =
      role === "staff" || role === "staff2" || role === "staff4";

    const manageMode = adminMode || warehouseStaffMode;

    setIsAdmin(adminMode);
    setCanManagePackages(manageMode);
    setCurrentWarehouseId(warehouseId);

    let rows: PackageRow[] = [];

    if (adminMode) {
      const { data } = await supabase
        .from("packages")
        .select("id, user_id, tracking_code, status, weight_kg, photo_count, warehouse_id")
        .order("created_at", { ascending: false });

      rows = (data || []) as PackageRow[];
    } else if (warehouseStaffMode && warehouseId) {
      const { data } = await supabase
        .from("packages")
        .select("id, user_id, tracking_code, status, weight_kg, photo_count, warehouse_id")
        .eq("warehouse_id", warehouseId)
        .order("created_at", { ascending: false });

      rows = (data || []) as PackageRow[];
    } else {
      const { data } = await supabase
        .from("packages")
        .select("id, user_id, tracking_code, status, weight_kg, photo_count, warehouse_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      rows = ((data || []) as PackageRow[]).filter(
        (pkg) => pkg.user_id === user.id
      );
    }

    setPackages(rows);

    setSelectedPackage((prev) => {
      if (!prev) return null;
      return rows.find((row) => row.id === prev.id) || null;
    });

    setSelectedPackageIds((prev) =>
      prev.filter((id) => rows.some((row) => row.id === id))
    );

    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) =>
      (pkg.tracking_code || "").toLowerCase().includes(query.toLowerCase())
    );
  }, [packages, query]);

  const allFilteredSelected =
    filteredPackages.length > 0 &&
    filteredPackages.every((pkg) => selectedPackageIds.includes(pkg.id));

  const selectedCount = selectedPackageIds.length;

  function togglePackageSelection(pkg: PackageRow) {
    setSelectedPackageIds((prev) => {
      if (prev.includes(pkg.id)) {
        return prev.filter((id) => id !== pkg.id);
      }
      return [...prev, pkg.id];
    });

    if (canManagePackages) {
      setSelectedPackage(pkg);
    }
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedPackageIds((prev) =>
        prev.filter((id) => !filteredPackages.some((pkg) => pkg.id === id))
      );
      return;
    }

    const filteredIds = filteredPackages.map((pkg) => pkg.id);

    setSelectedPackageIds((prev) => Array.from(new Set([...prev, ...filteredIds])));

    if (canManagePackages && filteredPackages.length > 0) {
      setSelectedPackage(filteredPackages[0]);
    }
  }

  function clearSelection() {
    setSelectedPackageIds([]);
  }

  async function handleBulkStatusUpdate() {
    if (!canManagePackages) return;
    if (!bulkStatus) {
      setActionMessage("Please select a status first.");
      return;
    }
    if (selectedPackageIds.length === 0) {
      setActionMessage("Please select at least one package.");
      return;
    }

    setBulkUpdating(true);
    setActionMessage("");

    const { error } = await supabase
      .from("packages")
      .update({ status: bulkStatus })
      .in("id", selectedPackageIds);

    if (error) {
      setBulkUpdating(false);
      setActionMessage(error.message);
      return;
    }

    setActionMessage(`Updated ${selectedPackageIds.length} package(s) to ${bulkStatus}.`);
    setBulkStatus("");
    await loadPage();
    setBulkUpdating(false);
  }

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-20 top-0 h-36 w-36 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-52 sm:w-52 lg:h-56 lg:w-56" />
          <div className="absolute -bottom-16 left-8 h-28 w-28 rounded-full bg-sky-500/10 blur-3xl sm:h-36 sm:w-36 lg:h-40 lg:w-40" />

          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                TRI Shipping Operations
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                Shipments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                {isAdmin
                  ? "Manage packages, tracking, and shipment status across warehouses."
                  : canManagePackages
                  ? "Manage packages, tracking, and shipment status for your warehouse."
                  : "View your own shipments and tracking details."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:min-w-[280px]">
              <QuickInfoPill
                label="Scope"
                value={
                  isAdmin
                    ? "All Warehouses"
                    : canManagePackages
                    ? "Warehouse View"
                    : "Personal View"
                }
              />
              <QuickInfoPill
                label="Packages"
                value={loading ? "Loading" : String(filteredPackages.length)}
              />
            </div>
          </div>
        </section>

        {!isAdmin && canManagePackages ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/70 shadow-lg backdrop-blur-sm sm:mt-5 sm:px-5">
            Warehouse filter active: {currentWarehouseId || "No warehouse assigned"}
          </div>
        ) : null}

        {!isAdmin && !canManagePackages ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/70 shadow-lg backdrop-blur-sm sm:mt-5 sm:px-5">
            Client view active: showing only your own shipments
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 xl:flex xl:flex-wrap">
          {canManagePackages ? (
            <Link
              href="/dashboard/packages/add"
              className="rounded-2xl bg-[#F5C84B] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-black transition hover:scale-[1.02] hover:opacity-95 sm:px-6"
            >
              Add Box
            </Link>
          ) : null}

          {canManagePackages && selectedPackage ? (
            <Link
              href={`/dashboard/packages/edit/${encodeURIComponent(
                selectedPackage.tracking_code
              )}`}
              className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-[#F5C84B] transition hover:bg-[#F5C84B]/20 sm:px-6"
            >
              Edit Selected
            </Link>
          ) : canManagePackages ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white/35 sm:px-6"
            >
              Edit Selected
            </button>
          ) : null}

          {canManagePackages && selectedPackage ? (
            <Link
              href={`/dashboard/update-status?code=${encodeURIComponent(
                selectedPackage.tracking_code
              )}`}
              className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-[#F5C84B] transition hover:bg-[#F5C84B]/20 sm:px-6"
            >
              Update Status
            </Link>
          ) : canManagePackages ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white/35 sm:px-6"
            >
              Update Status
            </button>
          ) : null}

          {canManagePackages && selectedPackage ? (
            <Link
              href={`/dashboard/packages/photos/${encodeURIComponent(
                selectedPackage.tracking_code
              )}`}
              className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-[#F5C84B] transition hover:bg-[#F5C84B]/20 sm:px-6"
            >
              Photos
            </Link>
          ) : canManagePackages ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.14em] text-white/35 sm:px-6"
            >
              Photos
            </button>
          ) : null}
        </div>

        {canManagePackages ? (
          <div className="mt-4 rounded-[22px] border border-[#F5C84B]/15 bg-[linear-gradient(180deg,rgba(245,200,75,0.08),rgba(255,255,255,0.03))] px-4 py-4 shadow-xl backdrop-blur-xl sm:mt-5 sm:rounded-[28px] sm:px-5 sm:py-5">
            {selectedCount > 0 ? (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="text-sm text-white">
                  <span className="font-black text-[#F5C84B]">{selectedCount}</span>{" "}
                  package(s) selected
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-3 text-white outline-none focus:border-[#F5C84B]/50 sm:w-auto"
                  >
                    <option value="">Select bulk status</option>
                    {BULK_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleBulkStatusUpdate}
                    disabled={bulkUpdating || !bulkStatus || selectedCount === 0}
                    className="rounded-2xl bg-[#F5C84B] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bulkUpdating ? "Updating..." : "Bulk Update"}
                  </button>

                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={bulkUpdating}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Bulk actions ready
                  </div>
                  <div className="mt-1 text-sm text-white/55">
                    Select one or more shipments to update status in one step.
                  </div>
                </div>

                <div className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                  No packages selected
                </div>
              </div>
            )}
          </div>
        ) : null}

        {selectedPackage && canManagePackages ? (
          <div className="mt-4 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-4 text-sm text-white sm:mt-5 sm:px-5">
            Selected shipment:{" "}
            <span className="font-bold text-[#F5C84B]">
              {selectedPackage.tracking_code}
            </span>
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mt-4 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-4 text-sm text-white sm:mt-5 sm:px-5">
            {actionMessage}
          </div>
        ) : null}

        <div className="mt-4 rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:mt-5 sm:rounded-[28px]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/35">
                🔎
              </span>
              <input
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setQuery(e.target.value)
                }
                placeholder="Search shipments by tracking code"
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] py-4 pl-14 pr-5 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                {loading
                  ? "Loading"
                  : `${filteredPackages.length} Result${filteredPackages.length === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px]">
          {loading ? (
            <>
              <div className="block md:hidden px-4 py-8 text-center text-sm text-white/55">
                Loading shipments...
              </div>
              <LoadingRows canManagePackages={canManagePackages} />
            </>
          ) : filteredPackages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-14 text-center sm:px-6 sm:py-16">
              <div className="mb-4 rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#F5C84B] sm:tracking-[0.28em]">
                No Results
              </div>
              <h3 className="text-xl font-black text-white sm:text-2xl">
                No shipments found
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/60">
                Try a different tracking code, clear your search, or add a new
                package to get started.
              </p>
            </div>
          ) : (
            <>
              <div className="block md:hidden space-y-3 p-3">
                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const isChecked = selectedPackageIds.includes(pkg.id);

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => canManagePackages && setSelectedPackage(pkg)}
                      className={`rounded-2xl border p-4 transition ${
                        canManagePackages ? "cursor-pointer" : ""
                      } ${
                        isSelected || isChecked
                          ? "border-[#F5C84B]/25 bg-[#F5C84B]/10"
                          : "border-white/10 bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                            Tracking
                          </div>
                          <div className="mt-1 break-all text-sm font-extrabold tracking-wide text-[#F5C84B]">
                            {pkg.tracking_code}
                          </div>
                        </div>

                        {canManagePackages ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePackageSelection(pkg)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 h-5 w-5 cursor-pointer rounded border-white/20 bg-[#0B162B]"
                            aria-label={`Select ${pkg.tracking_code}`}
                          />
                        ) : null}
                      </div>

                      <div className="mt-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${badgeClasses(
                            pkg.status
                          )}`}
                        >
                          {normalizeStatus(pkg.status) || "NOT SET"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MobileInfo
                          label="Weight"
                          value={
                            pkg.weight_kg === null || pkg.weight_kg === undefined
                              ? "Not added"
                              : `${pkg.weight_kg} kg`
                          }
                        />
                        <MobileInfo
                          label="Photos"
                          value={String(pkg.photo_count ?? 0)}
                        />
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <Link
                          href={`/track/${encodeURIComponent(pkg.tracking_code)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:border-[#F5C84B]/20 hover:bg-black/30"
                        >
                          View Track
                        </Link>

                        {isSelected && canManagePackages ? (
                          <div className="rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5C84B]">
                            Selected
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[820px] border-collapse lg:min-w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/10">
                      {canManagePackages ? (
                        <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={toggleSelectAllFiltered}
                            className="h-5 w-5 cursor-pointer rounded border-white/20 bg-[#0B162B]"
                            aria-label="Select all filtered packages"
                          />
                        </th>
                      ) : null}

                      <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
                        Tracking Code
                      </th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
                        Status
                      </th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
                        Weight
                      </th>
                      <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
                        Photos
                      </th>
                      <th className="px-4 py-4 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 sm:px-6 sm:text-[11px] sm:tracking-[0.28em]">
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPackages.map((pkg, index) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      const isChecked = selectedPackageIds.includes(pkg.id);

                      return (
                        <tr
                          key={pkg.id}
                          onClick={() => canManagePackages && setSelectedPackage(pkg)}
                          className={`border-b border-white/5 transition ${
                            canManagePackages ? "cursor-pointer" : ""
                          } ${
                            isSelected || isChecked
                              ? "bg-[#F5C84B]/10"
                              : index % 2 === 0
                              ? "bg-transparent hover:bg-white/[0.03]"
                              : "bg-black/10 hover:bg-white/[0.03]"
                          }`}
                        >
                          {canManagePackages ? (
                            <td
                              className="px-4 py-4 sm:px-6 sm:py-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePackageSelection(pkg)}
                                className="h-5 w-5 cursor-pointer rounded border-white/20 bg-[#0B162B]"
                                aria-label={`Select ${pkg.tracking_code}`}
                              />
                            </td>
                          ) : null}

                          <td className="px-4 py-4 sm:px-6 sm:py-5">
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-extrabold tracking-wide text-[#F5C84B] sm:text-base lg:text-lg">
                                {pkg.tracking_code}
                              </div>
                              {isSelected && canManagePackages ? (
                                <span className="w-fit rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5C84B]">
                                  Selected
                                </span>
                              ) : null}
                            </div>
                          </td>

                          <td className="px-4 py-4 sm:px-6 sm:py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em] ${badgeClasses(
                                pkg.status
                              )}`}
                            >
                              {normalizeStatus(pkg.status) || "NOT SET"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-white/85 sm:px-6 sm:py-5">
                            {pkg.weight_kg === null || pkg.weight_kg === undefined
                              ? "Not added"
                              : `${pkg.weight_kg} kg`}
                          </td>

                          <td className="px-4 py-4 text-white/85 sm:px-6 sm:py-5">
                            <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-white/85">
                              {pkg.photo_count ?? 0}
                            </span>
                          </td>

                          <td
                            className="px-4 py-4 text-right sm:px-6 sm:py-5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              href={`/track/${encodeURIComponent(pkg.tracking_code)}`}
                              className="inline-flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:border-[#F5C84B]/20 hover:bg-black/30 sm:text-xs sm:tracking-[0.16em]"
                            >
                              View Track
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
