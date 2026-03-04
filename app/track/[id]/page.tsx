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
            className="inline-flex mt-8 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Try another code
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
            className="inline-flex mt-8 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Try another code
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400">Tracking Not Found</h1>
          <p className="mt-4 text-gray-300">
            No shipment found for{" "}
            <span className="font-semibold text-white">{trackingCode}</span>
          </p>
          <Link
            href="/track"
            className="inline-flex mt-8 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Try another code
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
      <div className="w-full max-w-3xl rounded-2xl border border-blue-900 bg-[#0f172a] p-10 text-center shadow-xl">
        <h1 className="text-5xl font-extrabold text-yellow-400">Shipment Tracking</h1>

        <p className="mt-3 text-gray-300">
          Tracking code: <span className="text-white font-semibold">{trackingCode}</span>
        </p>

        {/* Luxury timeline */}
        <div className="mt-10">
          <div className="relative">
            <div className="h-[2px] w-full rounded-full bg-[#1c2b44]" />
            <div
              className="absolute top-0 left-0 h-[2px] rounded-full bg-yellow-400"
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
                        ? "border-yellow-400/60 bg-yellow-400/10"
                        : "border-[#1c2b44] bg-[#070b14]",
                    ].join(" ")}
                  >
                    <span className={["text-3xl", active ? "" : "opacity-40"].join(" ")}>
                      {s.icon}
                    </span>
                  </div>

                  <div
                    className={[
                      "mt-3 text-xs font-semibold tracking-widest uppercase",
                      current ? "text-yellow-400" : active ? "text-white" : "text-gray-500",
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
        <div className="mt-10 rounded-xl bg-[#111827] p-6 text-left">
          <div className="flex justify-between">
            <span className="text-gray-400">Current Status</span>
            <span className="font-bold text-yellow-400">{status}</span>
          </div>

          <div className="mt-4 text-sm text-gray-300">
            Created: {new Date(data.created_at).toLocaleString()}
          </div>

          <div className="mt-2 text-sm text-gray-300 break-all">
            Package ID: {data.id}
          </div>
        </div>

        <Link
          href="/track"
          className="inline-flex mt-10 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
        >
          Track another shipment
        </Link>
      </div>
    </main>
  );
}
