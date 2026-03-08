"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type PackageRow = {
  id: string;
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

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [canManagePackages, setCanManagePackages] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageRow | null>(null);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPackages([]);
        setIsAdmin(false);
        setCanManagePackages(false);
        setCurrentWarehouseId(null);
        setSelectedPackage(null);
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

      let queryBuilder = supabase
        .from("packages")
        .select("id, tracking_code, status, weight_kg, photo_count, warehouse_id")
        .order("created_at", { ascending: false });

      if (!adminMode && warehouseId) {
        queryBuilder = queryBuilder.eq("warehouse_id", warehouseId);
      }

      const { data } = await queryBuilder;
      const rows = (data || []) as PackageRow[];
      setPackages(rows);
      setSelectedPackage((prev) => {
        if (!prev) return null;
        return rows.find((row) => row.id === prev.id) || null;
      });
      setLoading(false);
    }

    loadPage();
  }, []);

  const filteredPackages = packages.filter((pkg) =>
    (pkg.tracking_code || "").toLowerCase().includes(query.toLowerCase())
  );

  function prettyStatus(status: string | null) {
    if (!status) return "Not set";
    return status.replace(/_/g, " ");
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-5xl font-extrabold text-[#F5C84B]">Packages</h1>
            <p className="mt-2 text-white/65">
              {isAdmin
                ? "Manage all shipments across warehouses."
                : canManagePackages
                ? "Manage packages for your warehouse."
                : "View packages for your warehouse only."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canManagePackages ? (
              <Link
                href="/dashboard/packages/add"
                className="rounded-2xl bg-[#F5C84B] px-6 py-4 text-center text-lg font-bold text-black transition hover:opacity-90"
              >
                Add Box
              </Link>
            ) : null}

            {canManagePackages && selectedPackage ? (
              <Link
                href={`/dashboard/packages/edit/${encodeURIComponent(
                  selectedPackage.tracking_code
                )}`}
                className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 text-center text-lg font-bold text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
              >
                Edit Selected
              </Link>
            ) : canManagePackages ? (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-lg font-bold text-white/35"
              >
                Edit Selected
              </button>
            ) : null}

            {canManagePackages && selectedPackage ? (
              <Link
                href={`/dashboard/packages/status/${encodeURIComponent(
                  selectedPackage.tracking_code
                )}`}
                className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 text-center text-lg font-bold text-[#F5C84B] transition hover:bg-[#F5C84B]/20"
              >
                Update Status
              </Link>
            ) : canManagePackages ? (
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-lg font-bold text-white/35"
              >
                Update Status
              </button>
            ) : null}
          </div>
        </div>

        {!isAdmin ? (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
            Warehouse filter active: {currentWarehouseId || "No warehouse assigned"}
          </div>
        ) : null}

        {selectedPackage ? (
          <div className="mb-6 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-5 py-4 text-sm text-white">
            Selected package:{" "}
            <span className="font-bold text-[#F5C84B]">
              {selectedPackage.tracking_code}
            </span>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/60">
            Select a package row to activate Edit Selected and Update Status.
          </div>
        )}

        <div className="mb-6 rounded-3xl border border-[#F5C84B]/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-sm">
          <input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            placeholder="Search by tracking code"
            className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/50"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#F5C84B]/10 bg-white/[0.04] shadow-2xl backdrop-blur-sm">
          {loading ? (
            <div className="p-6 text-white/70">Loading packages...</div>
          ) : filteredPackages.length === 0 ? (
            <div className="p-6 text-white/70">No packages found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#F5C84B]">
                      Tracking Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#F5C84B]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#F5C84B]">
                      Weight
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.2em] text-[#F5C84B]">
                      Photos
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-[#F5C84B]">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPackages.map((pkg, index) => {
                    const isSelected = selectedPackage?.id === pkg.id;

                    return (
                      <tr
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`cursor-pointer border-b border-white/5 transition ${
                          isSelected
                            ? "bg-[#F5C84B]/10"
                            : index % 2 === 0
                            ? "bg-transparent hover:bg-white/[0.03]"
                            : "bg-black/10 hover:bg-white/[0.03]"
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className="font-extrabold text-2xl text-[#F5C84B]">
                            {pkg.tracking_code}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white/90">
                            {prettyStatus(pkg.status)}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-white/85">
                          {pkg.weight_kg === null || pkg.weight_kg === undefined
                            ? "Not added"
                            : `${pkg.weight_kg} kg`}
                        </td>

                        <td className="px-6 py-5 text-white/85">
                          {pkg.photo_count ?? 0}
                        </td>

                        <td
                          className="px-6 py-5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/track/${encodeURIComponent(pkg.tracking_code)}`}
                            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-black/30"
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
