"use client";

import { useEffect, useMemo, useState } from "react";
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

function statusIcon(status: string) {
  const s = normalizeStatus(status);

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

      const { data: photoList, error: photoListError } = await supabase.storage
        .from("package-photos")
        .list(trackingCode, {
          limit: 100,
          sortBy: { column: "name", order: "desc" },
        });

      if (!photoListError && photoList && photoList.length > 0) {
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

  const currentStatus = normalizeStatus(pkg?.status || "");
  const currentStepIndex = STATUS_STEPS.indexOf(currentStatus);

  const visibleProgressIndex = useMemo(() => {
    if (currentStepIndex >= 0) return currentStepIndex;

    const eventStatuses = events.map((e) => normalizeStatus(e.status));
    const indexes = eventStatuses
      .map((s) => STATUS_STEPS.indexOf(s))
      .filter((n) => n >= 0);

    return indexes.length ? Math.max(...indexes) : -1;
  }, [currentStepIndex, events]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071427] px-4 text-white">
        <div className="text-lg font-semibold sm:text-xl">Loading tracking...</div>
      </main>
    );
  }

  if (error || !pkg) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
        <div className="w-full max-w-3xl rounded-[22px] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl backdrop-blur-xl sm:rounded-[28px] sm:p-8">
          <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
            TRI Shipping
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-[#F5C84B] sm:mt-4 sm:text-5xl">
            Tracking
          </h1>

          <p className="mt-4 text-base text-red-300 sm:text-xl">
            {error || "Tracking not found"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-40 sm:w-40" />

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
              TRI Shipping
            </div>

            <h1 className="mt-3 text-3xl font-extrabold text-[#F5C84B] sm:mt-4 sm:text-5xl">
              Track Shipment
            </h1>

            <p className="mt-2 break-all text-sm text-white/70 sm:mt-3 sm:text-lg">
              Tracking Code: {pkg.tracking_code}
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-5 py-5 text-center shadow-xl backdrop-blur-xl sm:mt-5 sm:rounded-[28px] sm:px-6 sm:py-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 sm:text-sm sm:tracking-[0.2em]">
            Current Status
          </p>
          <p className="mt-2 text-2xl font-extrabold text-[#F5C84B] sm:text-3xl">
            {currentStatus || "NOT SET"}
          </p>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:mt-5 sm:rounded-[28px] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-extrabold text-[#F5C84B] sm:text-2xl">
              Shipment Progress
            </h2>
            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {currentStatus || "NOT SET"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-5">
            {STATUS_STEPS.map((step, index) => {
              const completed = visibleProgressIndex >= index;
              const current = currentStatus === step;

              return (
                <div key={step} className="relative">
                  <div
                    className={`rounded-2xl border p-4 transition sm:p-5 ${
                      current
                        ? "border-[#F5C84B]/50 bg-[#F5C84B]/15"
                        : completed
                        ? "border-emerald-400/30 bg-emerald-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl sm:text-3xl">{statusIcon(step)}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] sm:text-xs ${
                          current
                            ? "bg-[#F5C84B] text-black"
                            : completed
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/50"
                        }`}
                      >
                        {current ? "Current" : completed ? "Done" : "Pending"}
                      </span>
                    </div>

                    <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-white/50 sm:text-sm sm:tracking-[0.18em]">
                      Step {index + 1}
                    </p>

                    <h3 className="mt-2 text-base font-bold text-white sm:text-lg">
                      {step}
                    </h3>
                  </div>

                  {index !== STATUS_STEPS.length - 1 ? (
                    <div className="absolute left-full top-1/2 hidden h-[2px] w-5 -translate-y-1/2 bg-white/10 md:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 sm:text-sm sm:tracking-wider">
              Tracking Code
            </p>
            <p className="mt-3 break-all text-xl font-bold text-white sm:text-2xl">
              {pkg.tracking_code}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 sm:text-sm sm:tracking-wider">
              Package Photos
            </p>
            <p className="mt-3 text-xl font-bold text-white sm:text-2xl">
              {photoUrls.length}
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:mt-5 sm:rounded-[28px] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-extrabold text-[#F5C84B] sm:text-2xl">
              Shipment Timeline
            </h2>
            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {events.length} event{events.length === 1 ? "" : "s"}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              No shipment events yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4 sm:space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#F5C84B]/30 bg-[#F5C84B]/10 text-xl sm:h-14 sm:w-14 sm:text-2xl">
                      {statusIcon(event.status)}
                    </div>
                    {index !== events.length - 1 ? (
                      <div className="mt-2 h-full min-h-[40px] w-px bg-white/10 sm:min-h-[48px]" />
                    ) : null}
                  </div>

                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-bold text-white sm:text-xl">
                        {normalizeStatus(event.status)}
                      </h3>
                      <p className="text-xs text-white/50 sm:text-sm">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>

                    {event.location ? (
                      <p className="mt-3 text-sm text-white/80 sm:text-base">
                        <span className="text-white/50">Location:</span>{" "}
                        {event.location}
                      </p>
                    ) : null}

                    {event.note ? (
                      <p className="mt-2 text-sm text-white/80 sm:text-base">
                        <span className="text-white/50">Note:</span> {event.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:mt-5 sm:rounded-[28px] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-extrabold text-[#F5C84B] sm:text-2xl">
              Package Photos
            </h2>
            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {photoUrls.length} photo{photoUrls.length === 1 ? "" : "s"}
            </span>
          </div>

          {photoUrls.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-white/55">
              No package photos uploaded yet.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="h-56 w-full object-cover sm:h-64"
                  />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
