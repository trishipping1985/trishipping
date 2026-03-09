"use client";

import { useEffect, useState } from "react";
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
  tracking_code: string;
  status: string | null;
  warehouse_id: string | null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [titleText, setTitleText] = useState("Welcome to your TRI Shipping dashboard.");
  const [totalPackages, setTotalPackages] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTotalPackages(0);
        setReceivedCount(0);
        setInTransitCount(0);
        setDeliveredCount(0);
        setTitleText("Welcome to your TRI Shipping dashboard.");
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

      let rows: PackageRow[] = [];

      if (adminMode) {
        const { data } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, warehouse_id")
          .order("created_at", { ascending: false });

        rows = (data || []) as PackageRow[];
        setTitleText("Overview of all shipments across warehouses.");
      } else if (warehouseStaffMode && warehouseId) {
        const { data } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, warehouse_id")
          .eq("warehouse_id", warehouseId)
          .order("created_at", { ascending: false });

        rows = (data || []) as PackageRow[];
        setTitleText("Overview of packages in your warehouse.");
      } else {
        const { data } = await supabase
          .from("packages")
          .select("id, user_id, tracking_code, status, warehouse_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        rows = ((data || []) as PackageRow[]).filter(
          (pkg) => pkg.user_id === user.id
        );
        setTitleText("Overview of your own packages.");
      }

      const total = rows.length;
      const received = rows.filter(
        (pkg) => (pkg.status || "").toUpperCase() === "RECEIVED"
      ).length;
      const transit = rows.filter((pkg) => {
        const s = (pkg.status || "").toUpperCase();
        return s === "IN TRANSIT" || s === "IN_TRANSIT";
      }).length;
      const delivered = rows.filter(
        (pkg) => (pkg.status || "").toUpperCase() === "DELIVERED"
      ).length;

      setTotalPackages(total);
      setReceivedCount(received);
      setInTransitCount(transit);
      setDeliveredCount(delivered);
      setLoading(false);
    }

    loadOverview();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-yellow-400">Overview</h1>
        <p className="mt-2 text-white/60">{titleText}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">Packages</div>
            <div className="text-3xl">📦</div>
          </div>
          <div className="mt-4 text-3xl font-bold">{loading ? "..." : totalPackages}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">Received</div>
            <div className="text-3xl">📥</div>
          </div>
          <div className="mt-4 text-3xl font-bold">{loading ? "..." : receivedCount}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">In Transit</div>
            <div className="text-3xl">🚚</div>
          </div>
          <div className="mt-4 text-3xl font-bold">{loading ? "..." : inTransitCount}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">Delivered</div>
            <div className="text-3xl">✅</div>
          </div>
          <div className="mt-4 text-3xl font-bold">{loading ? "..." : deliveredCount}</div>
        </div>
      </div>
    </div>
  );
}
