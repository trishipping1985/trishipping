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
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-black/10">
            {canManagePackages ? (
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Select
              </th>
            ) : null}
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Tracking Code
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Status
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Weight
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              Photos
            </th>
            <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
              View
            </th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index} className="border-b border-white/5">
              {canManagePackages ? (
                <td className="px-6 py-5">
                  <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
                </td>
              ) : null}

              <td className="px-6 py-5">
                <div className="h-5 w-28 animate-pulse rounded bg-[#F5C84B]/15" />
              </td>
              <td className="px-6 py-5">
                <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
              </td>
              <td className="px-6 py-5">
                <div className="h-5 w-20 animate-pulse rounded bg-white/10" />
              </td>
              <td className="px-6 py-5">
                <div className="h-5 w-10 animate-pulse rounded bg-white/10" />
              </td>
              <td className="px-6 py-5 text-right">
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
    <main className="min-h-screen bg-[#071427] px-4 py-8 text-white md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[32px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-20 top-0 h-56 w-56 rounded-full bg-[#F5C84B]/10 blur-3xl" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5C84B]">
                TRI Shipping Operations
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl xl:text-6xl">
                Shipments
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                {isAdmin
                  ? "Manage packages, tracking, and shipment status across warehouses."
                  : canManagePackages
                  ? "Manage packages, tracking, and shipment status for your warehouse."
                  : "View your own shipments and tracking details."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
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
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/70 shadow-lg backdrop-blur-sm">
            Warehouse filter active: {currentWarehouseId || "No warehouse assigned"}
          </div>
        ) : null}

        {!isAdmin && !canManagePackages ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-white/70 shadow-lg backdrop-blur-sm">
            Client view active: showing only your own shipments
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {canManagePackages ? (
            <Link
              href="/dashboard/packages/add"
              className="rounded-2xl bg-[#F5C84B] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-black transition hover:scale-[1.02] hover:opacity-95"
            >
              Add Box
            </Link>
          ) : null}

          {canManagePackages && selectedPackage ? (
            <Link
              href={`/dashboard/packages/edit/${encodeURIComponent(
                selectedPackage.tracking_code
              )}`}
              className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
            >
              Edit Selected
            </Link>
          ) : canManagePackages ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white/35"
            >
              Edit Selected
            </button>
          ) : null}

          {canManagePackages && selectedPackage ? (
            <Link
              href={`/dashboard/update-status?code=${encodeURIComponent(
                selectedPackage.tracking_code
              )}`}
              className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
            >
              Update Status
            </Link>
          ) : canManagePackages ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white/35"
            >
              Update Status
            </button>
          ) : null}

          {canManagePackages && selectedPackage ? (
            <Link
              href={`/dashboard/packages/photos/${encodeURIComponent(
                selectedPackage.tracking_code
              )}`}
              className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
            >
              Photos
            </Link>
          ) : canManagePackages ? (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white/35"
            >
              Photos
            </button>
          ) : null}
        </div>

        {canManagePackages ? (
          <div className="mt-6 rounded-[28px] border border-[#F5C84B]/15 bg-[linear-gradient(180deg,rgba(245,200,75,0.08),rgba(255,255,255,0.03))] px-5 py-5 shadow-xl backdrop-blur-xl">
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
                    className="rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-3 text-white outline-none focus:border-[#F5C84B]/50"
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
                    className="rounded-2xl bg-[#F5C84B] px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bulkUpdating ? "Updating..." : "Bulk Update"}
                  </button>

                  <button
                    type="button"
                    onClick={clearSelection}
                    disabled={bulkUpdating}
                    className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    Bulk actions ready
                  </div>
                  <div className="mt-1 text-sm text-white/55">
                    Select one or more shipments to update status in one step.
                  </div>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                  No packages selected
                </div>
              </div>
            )}
          </div>
        ) : null}

        {selectedPackage && canManagePackages ? (
          <div className="mt-6 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-5 py-4 text-sm text-white">
            Selected shipment:{" "}
            <span className="font-bold text-[#F5C84B]">
              {selectedPackage.tracking_code}
            </span>
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mt-6 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-5 py-4 text-sm text-white">
            {actionMessage}
          </div>
        ) : null}

        <div className="mt-6 rounded-[28px] border border-[#F5C84B]/10 bg-white/[0.04] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
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
                {loading ? "Loading" : `${filteredPackages.length} Result${filteredPackages.length === 1 ? "" : "s"}`}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[30px] border border-[#F5C84B]/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {loading ? (
            <LoadingRows canManagePackages={canManagePackages} />
          ) : filteredPackages.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-[#F5C84B]">
                No Results
              </div>
              <h3 className="text-2xl font-black text-white">
                No shipments found
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/60">
                Try a different tracking code, clear your search, or add a new
                package to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/10">
                    {canManagePackages ? (
                      <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAllFiltered}
                          className="h-5 w-5 cursor-pointer rounded border-white/20 bg-[#0B162B]"
                          aria-label="Select all filtered packages"
                        />
                      </th>
                    ) : null}

                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                      Tracking Code
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                      Weight
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                      Photos
                    </th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
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
                            className="px-6 py-5"
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

                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="font-extrabold tracking-wide text-[#F5C84B] sm:text-lg">
                              {pkg.tracking_code}
                            </div>
                            {isSelected && canManagePackages ? (
                              <span className="w-fit rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F5C84B]">
                                Selected
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] ${badgeClasses(
                              pkg.status
                            )}`}
                          >
                            {normalizeStatus(pkg.status) || "NOT SET"}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-white/85">
                          {pkg.weight_kg === null || pkg.weight_kg === undefined
                            ? "Not added"
                            : `${pkg.weight_kg} kg`}
                        </td>

                        <td className="px-6 py-5 text-white/85">
                          <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-bold text-white/85">
                            {pkg.photo_count ?? 0}
                          </span>
                        </td>

                        <td
                          className="px-6 py-5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/track/${encodeURIComponent(pkg.tracking_code)}`}
                            className="inline-flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-[#F5C84B]/20 hover:bg-black/30"
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
          )}
        </div>
      </div>
    </main>
  );
}
