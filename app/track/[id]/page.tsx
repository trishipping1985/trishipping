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
  photo_count: number | null;
};

type PackageEventRow = {
  id: string;
  tracking_code: string;
  status: string;
  location: string | null;
  note: string | null;
  created_at: string;
};

function statusIcon(status: string) {
  const s = status.toUpperCase();

  if (s === "RECEIVED") return "📦";
  if (s === "IN TRANSIT") return "✈️";
  if (s === "OUT FOR DELIVERY") return "🚚";
  if (s === "DELIVERED") return "✅";
  return "•";
}

export default function TrackPage() {
  const params = useParams();
  const rawId = String(params.id || "");
  const trackingCode = decodeURIComponent(rawId).trim().toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [events, setEvents] = useState<PackageEventRow[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    async function loadTracking() {
      setLoading(true);
      setError("");

      const { data: packageData, error: packageError } = await supabase
        .from("packages")
        .select("id, tracking_code, status, photo_count")
        .eq("tracking_code", trackingCode)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (packageError) {
        setError(packageError.message);
        setLoading(false);
        return;
      }

      if (!packageData) {
        setError("Tracking not found");
        setLoading(false);
        return;
      }

      setPkg(packageData as PackageRow);

      const { data: eventData, error: eventError } = await supabase
        .from("package_events")
        .select("id, tracking_code, status, location, note, created_at")
        .eq("tracking_code", trackingCode)
        .order("created_at", { ascending: true });

      if (eventError) {
        setError(eventError.message);
        setLoading(false);
        return;
      }

      setEvents((eventData || []) as PackageEventRow[]);

      const { data: photoList } = await supabase.storage
        .from("package-photos")
        .list(trackingCode, {
          limit: 100,
          sortBy: { column: "name", order: "desc" },
        });

      if (photoList && photoList.length > 0) {
        const urls = photoList
          .filter((file) => !!file.name)
          .map((file) => {
            const { data } = supabase.storage
              .from("package-photos")
              .getPublicUrl(`${trackingCode}/${file.name}`);

            return data.publicUrl;
          });

        setPhotoUrls(urls);
      } else {
        setPhotoUrls([]);
      }

      setLoading(false);
    }

    if (trackingCode) {
      loadTracking();
    }
  }, [trackingCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="text-xl font-semibold">Loading tracking...</div>
      </main>
    );
  }

  if (error || !pkg) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl text-center">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-4 text-xl text-red-300">{error || "Tracking not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            TRI Shipping
          </p>
          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Track Shipment
          </h1>
          <p className="mt-3 text-lg text-white/70">
            Tracking Code: {pkg.tracking_code}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-6 py-5 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Current Status
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#F5C84B]">
            {String(pkg.status || "").replace(/_/g, " ")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">
              Tracking Code
            </p>
            <p className="mt-3 text-2xl font-bold text-white">{pkg.tracking_code}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
            <p className="text-sm uppercase tracking-wider text-white/50">
              Package Photos
            </p>
            <p className="mt-3 text-2xl font-bold text-white">
              {photoUrls.length}
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-[#F5C84B]">
              Shipment Timeline
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {events.length} event{events.length === 1 ? "" : "s"}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              No shipment events yet.
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#F5C84B]/30 bg-[#F5C84B]/10 text-2xl">
                      {statusIcon(event.status)}
                    </div>
                    {index !== events.length - 1 ? (
                      <div className="mt-2 h-full min-h-[48px] w-px bg-white/10" />
                    ) : null}
                  </div>

                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-xl font-bold text-white">
                        {String(event.status || "").replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm text-white/50">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>

                    {event.location ? (
                      <p className="mt-3 text-white/80">
                        <span className="text-white/50">Location:</span>{" "}
                        {event.location}
                      </p>
                    ) : null}

                    {event.note ? (
                      <p className="mt-2 text-white/80">
                        <span className="text-white/50">Note:</span> {event.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-[#F5C84B]">
              Package Photos
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {photoUrls.length} photo{photoUrls.length === 1 ? "" : "s"}
            </span>
          </div>

          {photoUrls.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              No package photos uploaded yet.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photoUrls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:opacity-90"
                >
                  <img
                    src={url}
                    alt={`Package photo ${index + 1}`}
                    className="h-64 w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
