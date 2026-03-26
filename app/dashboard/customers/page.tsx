"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type PackageRow = {
  id: string;
  user_id: string | null;
  warehouse_id: string | null;
};

function normalizeRole(role?: string | null) {
  return String(role || "").trim().toLowerCase();
}

function customerLabel(customer: CustomerRow) {
  return customer.full_name || customer.email || "Unnamed Customer";
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
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
          setError("You are not allowed to view customers.");
          setCustomers([]);
          setLoading(false);
          return;
        }

        if (adminMode) {
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, full_name, email, phone, address, role, warehouse_id")
            .not("role", "in", "(admin,owner,staff,staff2,staff4)");

          if (usersError) {
            setError(usersError.message);
            setCustomers([]);
            setLoading(false);
            return;
          }

          setCustomers((usersData || []) as CustomerRow[]);
          setLoading(false);
          return;
        }

        if (!me?.warehouse_id) {
          setError("No warehouse assigned to this staff account.");
          setCustomers([]);
          setLoading(false);
          return;
        }

        const { data: packageRows, error: packagesError } = await supabase
          .from("packages")
          .select("id, user_id, warehouse_id")
          .eq("warehouse_id", me.warehouse_id);

        if (packagesError) {
          setError(packagesError.message);
          setCustomers([]);
          setLoading(false);
          return;
        }

        const uniqueCustomerIds = Array.from(
          new Set(
            ((packageRows || []) as PackageRow[])
              .map((pkg) => pkg.user_id)
              .filter((value): value is string => Boolean(value))
          )
        );

        if (uniqueCustomerIds.length === 0) {
          setCustomers([]);
          setLoading(false);
          return;
        }

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, full_name, email, phone, address, role, warehouse_id")
          .in("id", uniqueCustomerIds);

        if (usersError) {
          setError(usersError.message);
          setCustomers([]);
          setLoading(false);
          return;
        }

        const filtered = ((usersData || []) as CustomerRow[]).filter((item) => {
          const r = normalizeRole(item.role);
          return !["admin", "owner", "staff", "staff2", "staff4"].includes(r);
        });

        setCustomers(filtered);
        setLoading(false);
      } catch (err) {
        console.error("Customers page error:", err);
        setError("Failed to load customers.");
        setCustomers([]);
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((customer) => {
      return (
        customerLabel(customer).toLowerCase().includes(q) ||
        String(customer.email || "").toLowerCase().includes(q) ||
        String(customer.phone || "").toLowerCase().includes(q) ||
        String(customer.address || "").toLowerCase().includes(q)
      );
    });
  }, [customers, query]);

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
                Customers
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
                View customer names and contact details without opening Supabase.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:min-w-[280px]">
              <QuickInfoPill
                label="Scope"
                value={
                  isAdmin
                    ? "All Customers"
                    : warehouseId
                    ? "Warehouse Customers"
                    : "Restricted"
                }
              />
              <QuickInfoPill
                label="Results"
                value={loading ? "Loading" : String(filteredCustomers.length)}
              />
            </div>
          </div>
        </section>

        <div className="mt-4 rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:mt-5 sm:rounded-[28px]">
          <div className="relative">
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/35">
              🔎
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers by name, email, phone, or address"
              className="w-full rounded-2xl border border-white/10 bg-[#0B162B] py-4 pl-14 pr-5 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300 sm:mt-5">
            {error}
          </div>
        ) : null}

        {!authorized && !loading ? null : (
          <section className="mt-4 overflow-hidden rounded-[22px] border border-[#F5C84B]/10 bg-white/[0.04] shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:mt-5 sm:rounded-[30px]">
            {loading ? (
              <div className="p-5 text-sm text-white/70 sm:p-6">
                Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-5 text-sm text-white/70 sm:p-6">
                No customers found.
              </div>
            ) : (
              <div className="space-y-3 p-3 sm:p-4">
                {filteredCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/dashboard/customers/${encodeURIComponent(customer.id)}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-[#F5C84B]/20 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-bold text-[#F5C84B]">
                          {customerLabel(customer)}
                        </div>
                        <div className="mt-1 text-sm text-white/50">
                          Tap to open customer profile
                        </div>
                      </div>

                      <div className="rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F5C84B]">
                        Open
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoItem label="Email" value={customer.email || "Not set"} breakAll />
                      <InfoItem label="Phone" value={customer.phone || "Not set"} />
                      <InfoItem label="Address" value={customer.address || "Not set"} breakAll />
                      <InfoItem
                        label="Warehouse"
                        value={
                          customer.warehouse_id ||
                          (isAdmin ? "Unassigned" : warehouseId || "Unassigned")
                        }
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
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
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
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
