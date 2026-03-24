"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type CurrentUserRow = {
  id: string;
  role: string | null;
  warehouse_id: string | null;
};

type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string | null;
  warehouse_id: string | null;
};

type CustomerPackageRow = {
  id: string;
  tracking_code: string;
  status: string | null;
  weight_kg: number | null;
  photo_count: number | null;
  warehouse_id: string | null;
};

type PackagePhotoRow = {
  id: string;
  package_id: string;
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

function customerLabel(customer: CustomerRow | null) {
  if (!customer) return "Customer";
  return customer.full_name || customer.email || "Unnamed Customer";
}

export default function CustomerDetailsPage() {
  const params = useParams();
  const customerId = String(params.id || "");

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [packages, setPackages] = useState<CustomerPackageRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomerDetails() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError(authError?.message || "User not found");
          setAuthorized(false);
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
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const me = currentUser as CurrentUserRow | null;
        const role = normalizeRole(me?.role);
        const adminMode = role === "admin" || role === "owner";
        const staffMode = role === "staff" || role === "staff2" || role === "staff4";
        const allowed = adminMode || staffMode;

        setAuthorized(allowed);
        setIsAdmin(adminMode);
        setWarehouseId(me?.warehouse_id || null);

        if (!allowed) {
          setError("You are not allowed to view customer details.");
          setLoading(false);
          return;
        }

        const { data: customerData, error: customerError } = await supabase
          .from("users")
          .select("id, full_name, email, phone, address, role, warehouse_id")
          .eq("id", customerId)
          .maybeSingle();

        if (customerError) {
          setError(customerError.message);
          setLoading(false);
          return;
        }

        if (!customerData) {
          setError("Customer not found.");
          setLoading(false);
          return;
        }

        const foundCustomer = customerData as CustomerRow;
        const foundCustomerRole = normalizeRole(foundCustomer.role);

        if (["admin", "owner", "staff", "staff2", "staff4"].includes(foundCustomerRole)) {
          setError("This record is not a customer.");
          setLoading(false);
          return;
        }

        if (!adminMode && me?.warehouse_id) {
          const { data: warehousePackages, error: warehousePackagesError } = await supabase
            .from("packages")
            .select("id")
            .eq("user_id", customerId)
            .eq("warehouse_id", me.warehouse_id)
            .limit(1);

          if (warehousePackagesError) {
            setError(warehousePackagesError.message);
            setLoading(false);
            return;
          }

          if (!warehousePackages || warehousePackages.length === 0) {
            setError("This customer is not linked to your warehouse.");
            setLoading(false);
            return;
          }
        }

        setCustomer(foundCustomer);

        let packagesQuery = supabase
          .from("packages")
          .select("id, tracking_code, status, weight_kg, photo_count, warehouse_id")
          .eq("user_id", customerId)
          .order("created_at", { ascending: false });

        if (!adminMode && me?.warehouse_id) {
          packagesQuery = supabase
            .from("packages")
            .select("id, tracking_code, status, weight_kg, photo_count, warehouse_id")
            .eq("user_id", customerId)
            .eq("warehouse_id", me.warehouse_id)
            .order("created_at", { ascending: false });
        }

        const { data: packagesData, error: packagesError } = await packagesQuery;

        if (packagesError) {
          setError(packagesError.message);
          setLoading(false);
          return;
        }

        let customerPackages = (packagesData || []) as CustomerPackageRow[];

        const packageIds = customerPackages.map((pkg) => pkg.id).filter(Boolean);

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

            customerPackages = customerPackages.map((pkg) => ({
              ...pkg,
              photo_count: countMap[pkg.id] || 0,
            }));
          } else {
            customerPackages = customerPackages.map((pkg) => ({
              ...pkg,
              photo_count: pkg.photo_count ?? 0,
            }));
          }
        } else {
          customerPackages = customerPackages.map((pkg) => ({
            ...pkg,
            photo_count: 0,
          }));
        }

        setPackages(customerPackages);
        setLoading(false);
      } catch (err) {
        console.error("Customer details page error:", err);
        setError("Failed to load customer details.");
        setLoading(false);
      }
    }

    if (customerId) {
      loadCustomerDetails();
    }
  }, [customerId]);

  const totalPackages = useMemo(() => packages.length, [packages]);

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:rounded-[32px] lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                TRI Shipping CRM
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-5xl">
                {loading ? "Customer Profile" : customerLabel(customer)}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                View customer information and all packages from the dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/customers"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
              >
                Back to Customers
              </Link>
            </div>
          </div>
        </section>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300 sm:mt-5">
            {error}
          </div>
        ) : null}

        {!authorized && !loading ? null : (
          <>
            <section className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 xl:grid-cols-4">
              <DetailCard label="Full Name" value={customer?.full_name || "Not set"} />
              <DetailCard label="Email" value={customer?.email || "Not set"} breakAll />
              <DetailCard label="Phone" value={customer?.phone || "Not set"} />
              <DetailCard label="Address" value={customer?.address || "Not set"} breakAll />
            </section>

            <section className="mt-4 rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px]">
              <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-xl font-bold text-[#F5C84B] sm:text-2xl">
                    Customer Packages
                  </h2>
                  <p className="mt-1 text-sm text-white/55">
                    Total packages: {loading ? "Loading..." : totalPackages}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-5 text-sm text-white/70 sm:p-6">
                  Loading customer packages...
                </div>
              ) : packages.length === 0 ? (
                <div className="p-5 text-sm text-white/70 sm:p-6">
                  No packages found for this customer.
                </div>
              ) : (
                <div className="space-y-3 p-3 sm:p-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-lg font-bold text-[#F5C84B]">
                            {pkg.tracking_code}
                          </div>
                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${badgeClasses(
                                pkg.status
                              )}`}
                            >
                              {normalizeStatus(pkg.status) || "NOT SET"}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/track/${encodeURIComponent(pkg.tracking_code)}`}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white transition hover:bg-black/30"
                        >
                          Open Tracking
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <InfoItem
                          label="Weight"
                          value={
                            pkg.weight_kg === null || pkg.weight_kg === undefined
                              ? "Not added"
                              : `${pkg.weight_kg} kg`
                          }
                        />
                        <InfoItem
                          label="Photos"
                          value={String(pkg.photo_count ?? 0)}
                        />
                        <InfoItem
                          label="Warehouse"
                          value={
                            pkg.warehouse_id ||
                            (isAdmin ? "Unassigned" : warehouseId || "Unassigned")
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function DetailCard({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className={`mt-2 text-sm text-white/85 sm:text-base ${breakAll ? "break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className={`mt-1 text-sm text-white/80 ${breakAll ? "break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}
