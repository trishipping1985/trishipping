import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

type UserRow = {
  id: string;
  role: string | null;
  warehouse_id: string | null;
};

export default async function DashboardPage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rows: { status: string | null }[] = [];
  let titleText = "Welcome to your TRI Shipping dashboard.";

  if (user) {
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

    if (adminMode) {
      const { data } = await supabase
        .from("packages")
        .select("status");

      rows = data || [];
      titleText = "Overview of all shipments across warehouses.";
    } else if (warehouseStaffMode && warehouseId) {
      const { data } = await supabase
        .from("packages")
        .select("status")
        .eq("warehouse_id", warehouseId);

      rows = data || [];
      titleText = "Overview of packages in your warehouse.";
    } else {
      const { data } = await supabase
        .from("packages")
        .select("status, user_id")
        .eq("user_id", user.id);

      rows = (data || []).map((item) => ({
        status: item.status,
      }));
      titleText = "Overview of your own packages.";
    }
  }

  const totalPackages = rows.length;
  const receivedCount = rows.filter(
    (pkg) => (pkg.status || "").toUpperCase() === "RECEIVED"
  ).length;
  const inTransitCount = rows.filter((pkg) => {
    const s = (pkg.status || "").toUpperCase();
    return s === "IN TRANSIT" || s === "IN_TRANSIT";
  }).length;
  const deliveredCount = rows.filter(
    (pkg) => (pkg.status || "").toUpperCase() === "DELIVERED"
  ).length;

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
          <div className="mt-4 text-3xl font-bold">{totalPackages}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">Received</div>
            <div className="text-3xl">📥</div>
          </div>
          <div className="mt-4 text-3xl font-bold">{receivedCount}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">In Transit</div>
            <div className="text-3xl">🚚</div>
          </div>
          <div className="mt-4 text-3xl font-bold">{inTransitCount}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">Delivered</div>
            <div className="text-3xl">✅</div>
          </div>
          <div className="mt-4 text-3xl font-bold">{deliveredCount}</div>
        </div>
      </div>
    </div>
  );
}
