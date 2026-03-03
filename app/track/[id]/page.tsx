"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PackageRow = {
  tracking_code: string;
  status: string | null;
  photo_count: number | null;
};

function normalizeStatus(raw: unknown) {
  const s = String(raw ?? "RECEIVED").toUpperCase().trim();
  return s || "RECEIVED";
}

function statusIcon(status: string) {
  switch (status) {
    case "RECEIVED":
      return "📦";
    case "SORTED":
      return "🗂️";
    case "WEIGHED":
      return "⚖️";
    case "PHOTOGRAPHED":
      return "📸";
    case "READY_FOR_CONSOLIDATION":
      return "✅";
    case "CONSOLIDATED":
      return "🧳";
    case "SHIPPED":
      return "✈️";
    case "DELIVERED":
      return "🏁";
    default:
      return "📦";
  }
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function TrackResultPage({
  params,
}: {
  params: { id: string };
}) {
  const trackingCode = decodeURIComponent(params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<PackageRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStatus = useMemo(
    () => normalizeStatus(row?.status),
    [row?.status]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("packages")
          .select("tracking_code,status,photo_count")
          .eq("tracking_code", trackingCode)
          .maybeSingle();

        if (cancelled) return;

        if (error) throw error;
        setRow((data as PackageRow) ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load tracking");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (trackingCode) load();
    return () => {
      cancelled = true;
    };
  }, [trackingCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white/80">
          Loading tracking…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <div className="text-2xl font-semibold text-white">Error</div>
          <div className="mt-2 text-white/70">{error}</div>
          <div className="mt-6">
            <Link
              href="/track"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-white hover:bg-white/15"
            >
              New Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-3xl font-semibold text-[#f6c453]">
            Tracking Not Found
          </div>
          <div className="mt-2 text-white/70">
            No shipment was found for tracking code:
          </div>
          <div className="mt-2 text-xl font-bold text-white">{trackingCode}</div>

          <div className="mt-6">
            <Link
              href="/track"
              className="inline-flex items-center justify-center rounded-xl bg-[#f6c453] px-5 py-3 font-semibold text-black hover:opacity-90"
            >
              Try another code
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const photos = row.photo_count ?? 0;

  return (
    <div className="min-h-screen px-6 py-10">
      <style>{`
        @keyframes triPulse {
          0% { transform: scale(1); opacity: .85; }
          70% { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
      `}</style>

      <div className="mx-auto w-full max-w-5xl rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-5xl font-extrabold text-[#f6c453]">
              Shipment Tracking
            </div>
            <div className="mt-2 text-white/70">
              Tracking code:{" "}
              <span className="font-semibold text-white">{trackingCode}</span>
            </div>
          </div>

          <Link
            href="/track"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-white hover:bg-white/15"
          >
            New Search
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* STATUS */}
          <div className="rounded-3xl border border-white/10 bg-black/20 p-7">
            <div className="text-white/70">Current Status</div>

            <div className="mt-4 flex items-center gap-3">
              {/* animated dot */}
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full bg-[#f6c453]/25" />
                <div
                  className="absolute inset-0 rounded-full border border-[#f6c453]/60"
                  style={{ animation: "triPulse 1.6s infinite" }}
                />
                <div className="absolute inset-2 rounded-full bg-[#f6c453]" />
              </div>

              {/* icon + badge */}
              <div className="flex items-center gap-3">
                <div className="text-2xl">{statusIcon(currentStatus)}</div>
                <div className="inline-flex items-center rounded-full border border-[#f6c453]/30 bg-[#f6c453]/10 px-4 py-2 text-sm font-semibold text-[#f6c453]">
                  {statusLabel(currentStatus)}
                </div>
              </div>
            </div>

            <div className="mt-5 text-white/75">
              Your shipment is currently marked as{" "}
              <span className="font-bold text-white">
                {statusLabel(currentStatus)}
              </span>
              .
            </div>
          </div>

          {/* PHOTOS */}
          <div className="rounded-3xl border border-white/10 bg-black/20 p-7">
            <div className="text-white/70">Photos</div>
            <div className="mt-4 text-6xl font-extrabold text-white">
              {photos}
            </div>
            <div className="mt-2 text-white/70">
              Package photos uploaded by TRI Shipping
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
