import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function TrackPage({ params }: { params: { id?: string } }) {

  const trackingCode = params?.id?.trim();

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
            Enter a tracking code
          </Link>
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("tracking_code", trackingCode)
    .limit(1)
    .maybeSingle();

  if (!data) {
    return (
      <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400">Tracking Not Found</h1>

          <p className="mt-4 text-gray-300">
            No shipment found for <span className="text-white">{trackingCode}</span>
          </p>

          <Link
            href="/track"
            className="inline-flex mt-8 rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
          >
            Try another code
          </Link>
        </div>
      </main>
    );
  }

  const status = data.status?.toUpperCase() || "RECEIVED";

  const steps = [
    { key: "RECEIVED", icon: "✔", label: "Received" },
    { key: "IN_TRANSIT", icon: "📦", label: "In Transit" },
    { key: "OUT_FOR_DELIVERY", icon: "🚚", label: "Out For Delivery" },
    { key: "DELIVERED", icon: "🏁", label: "Delivered" },
  ];

  const current = steps.findIndex((s) => s.key === status);

  return (
    <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 shadow-xl text-center">

        <h1 className="text-5xl font-extrabold text-yellow-400">
          Shipment Tracking
        </h1>

        <p className="mt-3 text-gray-300">
          Code: <span className="text-white">{trackingCode}</span>
        </p>

        {/* STATUS TIMELINE */}
        <div className="mt-10 grid grid-cols-4 gap-4">

          {steps.map((step, i) => {
            const active = i <= current;

            return (
              <div key={step.key} className="text-center">

                <div
                  className={`text-4xl ${
                    active ? "text-yellow-400" : "text-gray-600"
                  }`}
                >
                  {step.icon}
                </div>

                <div className="mt-2 text-xs tracking-widest">
                  {step.label}
                </div>

              </div>
            );
          })}

        </div>

        <div className="mt-10 text-sm text-gray-300">
          Created: {new Date(data.created_at).toLocaleString()}
        </div>

        <Link
          href="/track"
          className="inline-block mt-8 rounded-xl bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300"
        >
          Track another shipment
        </Link>

      </div>
    </main>
  );
}
