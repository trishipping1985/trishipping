import Link from "next/link";

export default function DashboardTrackingPage() {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#d4af37]">Tracking</h1>
        <Link
          href="/track"
          className="rounded-xl px-4 py-2 text-sm font-semibold
                     bg-white/5 text-white ring-1 ring-white/12
                     hover:bg-white/10 transition"
        >
          Public tracking page
        </Link>
      </div>

      <p className="mt-2 text-white/65 text-sm">
        Dashboard tracking view (client-only). Next: show your shipment timeline
        from Supabase.
      </p>

      <div className="mt-6 rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
        <div className="text-sm font-semibold">Coming next</div>
        <div className="mt-2 text-sm text-white/60">
          We’ll connect tracking events and display them here.
        </div>
      </div>
    </div>
  );
}
