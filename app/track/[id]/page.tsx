import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function TrackPage({ params }: { params: { id: string } }) {
  const trackingCode = decodeURIComponent(params?.id || "").trim();

  if (!trackingCode) {
    return (
      <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400">Tracking</h1>
          <p className="mt-4 text-gray-300">Missing tracking code</p>
          <Link
            href="/track"
            className="inline-flex mt-8 rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Enter a code
          </Link>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("packages")
    .select("id, tracking_code, status, created_at")
    .eq("tracking_code", trackingCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-xl">
          <h1 className="text-4xl font-bold text-yellow-400">Error</h1>
          <p className="mt-4 text-gray-300">{error.message}</p>
          <Link
            href="/track"
            className="inline-flex mt-8 rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Try again
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400">Not Found</h1>
          <p className="mt-4 text-gray-300">
            No shipment found for <span className="font-semibold text-white">{trackingCode}</span>
          </p>
          <Link
            href="/track"
            className="inline-flex mt-8 rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Enter a new code
          </Link>
        </div>
      </main>
    );
  }

  const status = String(data.status || "").toUpperCase();

  const steps = [
    { key: "RECEIVED", label: "Received", icon: "✔" },
    { key: "IN_TRANSIT", label: "In Transit", icon: "📦" },
    { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🚚" },
    { key: "DELIVERED", label: "Delivered", icon: "🏁" },
  ];

  const idx = Math.max(0, steps.findIndex((s) => s.key === status));

  return (
    <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 shadow-[0_0_120px_rgba(245,158,11,0.08)] text-center">
        <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-widest text-white/70">
          TRI SHIPPING • LIVE STATUS
        </div>

        <h1 className="mt-6 text-5xl font-extrabold text-yellow-400">
          Shipment Tracking
        </h1>

        <p className="mt-3 text-white/60">
          Code: <span className="font-semibold text-white">{trackingCode}</span>
        </p>

        {/* Progress bar */}
        <div className="mt-10">
          <div className="relative">
            <div className="h-[2px] w-full rounded-full bg-white/10" />
            <div
              className="absolute top-0 left-0 h-[2px] rounded-full bg-yellow-400 shadow-[0_0_18px_rgba(245,158,11,0.5)]"
              style={{ width: `${(idx / (steps.length - 1)) * 100}%` }}
            />
          </div>

          <div className="mt-8 grid grid-cols-4 gap-2">
            {steps.map((s, i) => {
              const active = i <= idx;
              const current = i === idx;

              return (
                <div key={s.key} className="text-center">
                  <div
                    className={[
                      "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border",
                      active
                        ? "border-yellow-400/50 bg-yellow-400/10"
                        : "border-white/10 bg-black/20",
                    ].join(" ")}
                  >
                    <span className={["text-3xl", active ? "" : "opacity-40"].join(" ")}>
                      {s.icon}
                    </span>
                  </div>

                  <div
                    className={[
                      "mt-3 text-xs font-semibold tracking-widest uppercase",
                      current ? "text-yellow-400" : active ? "text-white" : "text-white/40",
                    ].join(" ")}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details */}
        <div className="mt-10 rounded-2xl border border-white/10 bg-black/20 p-6 text-left">
          <div className="flex justify-between">
            <span className="text-white/60">Current Status</span>
            <span className="font-bold text-yellow-400">{status}</span>
          </div>

          <div className="mt-4 text-sm text-white/70">
            Created: {new Date(data.created_at).toLocaleString()}
          </div>

          <div className="mt-2 text-sm text-white/70 break-all">
            Package ID: {data.id}
          </div>
        </div>

        <Link
          href="/track"
          className="inline-flex mt-10 rounded-2xl bg-yellow-400 px-7 py-3 font-semibold text-black hover:bg-yellow-300"
        >
          Track another shipment
        </Link>
      </div>
    </main>
  );
}
