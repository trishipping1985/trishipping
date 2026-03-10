"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type PackageRow = {
  id: string;
  tracking_code: string;
  status: string | null;
};

type EventRow = {
  id: string;
  status: string;
  location: string | null;
  note: string | null;
  created_at: string;
};

const STATUS_STEPS = [
  "RECEIVED",
  "IN TRANSIT",
  "OUT FOR DELIVERY",
  "DELIVERED",
];

function normalizeStatus(status: string | null) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

function icon(status: string) {
  const s = normalizeStatus(status);

  if (s === "RECEIVED") return "📦";
  if (s === "IN TRANSIT") return "✈️";
  if (s === "OUT FOR DELIVERY") return "🚚";
  if (s === "DELIVERED") return "✅";

  return "•";
}

export default function TrackPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params.id || "")).toUpperCase();

  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: packageData, error: pkgError } = await supabase
        .from("packages")
        .select("id, tracking_code, status")
        .eq("tracking_code", id)
        .limit(1)
        .maybeSingle();

      if (pkgError) {
        setError(pkgError.message);
        setLoading(false);
        return;
      }

      if (!packageData) {
        setError("Tracking not found");
        setLoading(false);
        return;
      }

      setPkg(packageData);

      const { data: eventData } = await supabase
        .from("package_events")
        .select("*")
        .eq("tracking_code", id)
        .order("created_at", { ascending: true });

      setEvents(eventData || []);
      setLoading(false);
    }

    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071427] text-white">
        Loading tracking...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#071427] text-white">
        {error}
      </main>
    );
  }

  const currentStatus = normalizeStatus(pkg?.status || "");

  return (
    <main className="min-h-screen bg-[#071427] text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <div className="text-center">
          <p className="text-white/50 uppercase tracking-widest text-sm">
            TRI Shipping
          </p>

          <h1 className="text-5xl font-bold text-[#F5C84B] mt-4">
            Track Shipment
          </h1>

          <p className="text-white/70 mt-3 text-lg">
            Tracking Code: {pkg?.tracking_code}
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-4 gap-6">
          {STATUS_STEPS.map((step) => {
            const active = currentStatus === step;

            return (
              <div
                key={step}
                className={`p-6 rounded-2xl border ${
                  active
                    ? "border-[#F5C84B] bg-[#F5C84B]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="text-3xl">{icon(step)}</div>

                <p className="mt-4 text-sm text-white/60 uppercase">
                  Status
                </p>

                <h3 className="text-xl font-bold mt-1">{step}</h3>
              </div>
            );
          })}
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-bold text-[#F5C84B]">
            Shipment Timeline
          </h2>

          <div className="mt-8 space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-6 rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="flex justify-between">
                  <h3 className="text-lg font-bold">
                    {normalizeStatus(event.status)}
                  </h3>

                  <span className="text-white/50 text-sm">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>

                {event.location && (
                  <p className="mt-3 text-white/70">
                    Location: {event.location}
                  </p>
                )}

                {event.note && (
                  <p className="mt-1 text-white/60">
                    {event.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
