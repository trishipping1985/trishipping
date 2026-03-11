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

type RecentPackageRow = {
  id: string;
  tracking_code: string;
  status: string | null;
  created_at: string;
  users:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
};

function prettyStatus(status: string | null) {
  if (!status) return "Not set";
  return status.replace(/_/g, " ");
}

function getCustomerName(
  users: RecentPackageRow["users"]
) {
  if (!users) return "-";
  if (Array.isArray(users)) {
    return users[0]?.full_name || "-";
  }
  return users.full_name || "-";
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [packagesCount, setPackagesCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [recentPackages, setRecentPackages] = useState<RecentPackageRow[]>([]);
  const [titleText, setTitleText] = useState("Overview of your shipments.");
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
        setError("Unable to load dashboard");
        return;
      }

      const { data: currentUser, error: userError } = await supabase
        .from("users")
        .select("id, role, warehouse_id")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        setLoading(false);
        setError(userError.message);
        return;
      }

      const me = currentUser as UserRow | null;
      const role = String(me?.role || "").trim().toLowerCase();
      const warehouseId = me?.warehouse_id || null;

      const isAdmin = role === "admin" || role === "owner";
      const isStaff =
        role === "staff" || role === "staff2" || role === "staff4";

      if (isAdmin) {
        setTitleText("Overview of all shipments across warehouses.");
      } else if (isStaff) {
        setTitleText("Overview of packages in your warehouse.");
      } else {
        setTitleText("Overview of your shipments.");
      }

      let packageCountQuery = supabase
        .from("packages")
        .select("*", { count: "exact", head: true });

      let receivedCountQuery = supabase
        .from("packages")
        .select("*", { count: "exact", head: true })
        .eq("status", "RECEIVED");

      let inTransitCountQuery = supabase
        .from("packages")
        .select("*", { count: "exact", head: true })
        .eq("status", "IN TRANSIT");

      let deliveredCountQuery = supabase
        .from("packages")
        .select("*", { count: "exact", head: true })
        .eq("status", "DELIVERED");

      let recentPackagesQuery = supabase
        .from("packages")
        .select(
          `
          id,
          tracking_code,
          status,
          created_at,
          users (
            full_name
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (isAdmin) {
        // no extra filter
      } else if (isStaff && warehouseId) {
        packageCountQuery = packageCountQuery.eq("warehouse_id", warehouseId);
        receivedCountQuery = receivedCountQuery.eq("warehouse_id", warehouseId);
        inTransitCountQuery = inTransitCountQuery.eq("warehouse_id", warehouseId);
        deliveredCountQuery = deliveredCountQuery.eq("warehouse_id", warehouseId);
        recentPackagesQuery = recentPackagesQuery.eq("warehouse_id", warehouseId);
      } else {
        packageCountQuery = packageCountQuery.eq("user_id", user.id);
        receivedCountQuery = receivedCountQuery.eq("user_id", user.id);
        inTransitCountQuery = inTransitCountQuery.eq("user_id", user.id);
        deliveredCountQuery = deliveredCountQuery.eq("user_id", user.id);
        recentPackagesQuery = recentPackagesQuery.eq("user_id", user.id);
      }

      const [
        packageCountRes,
        receivedCountRes,
        inTransitCountRes,
        deliveredCountRes,
        recentPackagesRes,
      ] = await Promise.all([
        packageCountQuery,
        receivedCountQuery,
        inTransitCountQuery,
        deliveredCountQuery,
        recentPackagesQuery,
      ]);

      if (recentPackagesRes.error) {
        setLoading(false);
        setError(recentPackagesRes.error.message);
        return;
      }

      setPackagesCount(packageCountRes.count || 0);
      setReceivedCount(receivedCountRes.count || 0);
      setInTransitCount(inTransitCountRes.count || 0);
      setDeliveredCount(deliveredCountRes.count || 0);
      setRecentPackages((recentPackagesRes.data || []) as RecentPackageRow[]);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  const emptyText = useMemo(() => {
    if (loading) return "Loading recent packages...";
    return "No recent packages found.";
  }, [loading]);

  return (
    <main className="min-h-screen bg-[#071427] px-4 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">
            Overview
          </h1>
          <p className="mt-3 text-lg text-white/75">{titleText}</p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl text-white/85">Packages</p>
              <span className="text-3xl">📦</span>
            </div>
            <p className="mt-6 text-5xl font-extrabold text-white">
              {loading ? "..." : packagesCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl text-white/85">Received</p>
              <span className="text-3xl">📥</span>
            </div>
            <p className="mt-6 text-5xl font-extrabold text-white">
              {loading ? "..." : receivedCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl text-white/85">In Transit</p>
              <span className="text-3xl">🚚</span>
            </div>
            <p className="mt-6 text-5xl font-extrabold text-white">
              {loading ? "..." : inTransitCount}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xl text-white/85">Delivered</p>
              <span className="text-3xl">✅</span>
            </div>
            <p className="mt-6 text-5xl font-extrabold text-white">
              {loading ? "..." : deliveredCount}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-[#F5C84B]">
              Recent Packages
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              Latest 5
            </span>
          </div>

          {recentPackages.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-8 text-center text-white/60">
              {emptyText}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.18em] text-[#F5C84B]">
                      Tracking
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.18em] text-[#F5C84B]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.18em] text-[#F5C84B]">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.18em] text-[#F5C84B]">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentPackages.map((pkg, index) => (
                    <tr
                      key={pkg.id}
                      className={`border-b border-white/5 ${
                        index % 2 === 0 ? "bg-transparent" : "bg-black/10"
                      }`}
                    >
                      <td className="px-4 py-4 font-bold text-white">
                        {pkg.tracking_code}
                      </td>
                      <td className="px-4 py-4 text-white/85">
                        {prettyStatus(pkg.status)}
                      </td>
                      <td className="px-4 py-4 text-white/85">
                        {getCustomerName(pkg.users)}
                      </td>
                      <td className="px-4 py-4 text-white/70">
                        {new Date(pkg.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
