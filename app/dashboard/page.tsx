import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function DashboardPage() {
  const { data } = await supabase
    .from("packages")
    .select("status");

  const rows = data || [];

  const totalPackages = rows.length;
  const receivedCount = rows.filter(
    (pkg) => (pkg.status || "").toUpperCase() === "RECEIVED"
  ).length;
  const inTransitCount = rows.filter((pkg) => {
    const s = (pkg.status || "").toUpperCase();
    return s === "IN TRANSIT" || s === "IN_TRANSIT";
  }).length;
  const outForDeliveryCount = rows.filter((pkg) => {
    const s = (pkg.status || "").toUpperCase();
    return s === "OUT FOR DELIVERY" || s === "OUT_FOR_DELIVERY";
  }).length;
  const deliveredCount = rows.filter(
    (pkg) => (pkg.status || "").toUpperCase() === "DELIVERED"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-yellow-400">Overview</h1>
        <p className="mt-2 text-white/60">
          Welcome to your TRI Shipping dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="text-sm text-white/60">Packages</div>
          <div className="mt-2 text-3xl font-bold">{totalPackages}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="text-sm text-white/60">Received</div>
          <div className="mt-2 text-3xl font-bold">{receivedCount}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="text-sm text-white/60">In Transit</div>
          <div className="mt-2 text-3xl font-bold">{inTransitCount}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <div className="text-sm text-white/60">Delivered</div>
          <div className="mt-2 text-3xl font-bold">{deliveredCount}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
        <h2 className="mb-4 text-xl font-semibold">Live shipping summary</h2>
        <ul className="space-y-2 text-white/70">
          <li>Total packages: {totalPackages}</li>
          <li>Received: {receivedCount}</li>
          <li>In transit: {inTransitCount}</li>
          <li>Out for delivery: {outForDeliveryCount}</li>
          <li>Delivered: {deliveredCount}</li>
        </ul>
      </div>
    </div>
  );
}
