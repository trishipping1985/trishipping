"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TrackResultPage() {
  const params = useParams();
  const trackingCode = decodeURIComponent(String(params.id || ""));

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPackage() {
      if (!trackingCode) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("tracking_code", trackingCode)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPkg(data);
      setLoading(false);
    }

    loadPackage();

    return () => {
      mounted = false;
    };
  }, [trackingCode]);

  const statusLabel = useMemo(() => {
    const raw = String(pkg?.status || "RECEIVED");
    return raw.replaceAll("_", " ");
  }, [pkg]);

  const progress = useMemo(() => {
    const steps = [
      "RECEIVED",
      "SORTED",
      "WEIGHED",
      "PHOTOGRAPHED",
      "READY_FOR_CONSOLIDATION",
      "CONSOLIDATED",
      "SHIPPED",
      "DELIVERED",
    ];

    const current = String(pkg?.status || "RECEIVED");
    const index = steps.indexOf(current);
    if (index === -1) return 12;

    return Math.max(12, Math.min(100, ((index + 1) / steps.length) * 100));
  }, [pkg]);

  function getStatusTone(status: string) {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30";
      case "SHIPPED":
      case "CONSOLIDATED":
        return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30";
      default:
        return "bg-[#d4af37]/15 text-[#f3d57a] ring-1 ring-[#d4af37]/30";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050914] text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#050914] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[28px] bg-white/6 ring-1 ring-white/12 p-8 text-center backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-[#d4af37]">Tracking Not Found</h1>
          <p className="mt-3 text-white/65">
            No shipment was found for tracking code:
          </p>
          <p className="mt-2 text-lg font-semibold">{trackingCode}</p>

          <Link
            href="/track"
            className="inline-block mt-6 rounded-xl px-5 py-3 font-semibold bg-[#d4af37] text-[#050914] hover:bg-[#e6c55a] transition"
          >
            Try another code
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[30px] bg-white/6 ring-1 ring-white/12 p-8 md:p-10 backdrop-blur-sm shadow-[0_0_80px_rgba(212,175,55,0.06)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold text-[#f3d57a] ring-1 ring-[#d4af37]/20">
                TRI Shipping
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-bold text-[#d4af37]">
                Shipment Tracking
              </h1>

              <p className="mt-3 text-white/70">
                Tracking code:{" "}
                <span className="text-white font-semibold">{pkg.tracking_code}</span>
              </p>
            </div>

            <Link
              href="/track"
              className="rounded-xl px-4 py-3 font-semibold bg-white/5 ring-1 ring-white/12 hover:bg-white/10 transition text-center"
            >
              New Search
            </Link>
          </div>

          <div className="mt-8 rounded-[24px] bg-[#0b1328]/70 ring-1 ring-white/10 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-white/50">Current Status</div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${getStatusTone(
                      String(pkg.status || "RECEIVED")
                    )}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>

              <div className="min-w-[120px]">
                <div className="text-sm text-white/50">Photos</div>
                <div className="mt-2 text-3xl font-bold text-white">
                  {pkg.photo_count ?? 0}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-white/45">
                <span>Received</span>
                <span>Delivered</span>
              </div>

              <div className="mt-2 h-3 w-full rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#d4af37] via-[#e6c55a] to-[#f3d57a] shadow-[0_0_18px_rgba(212,175,55,0.55)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-white/60">
                Your shipment is currently marked as{" "}
                <span className="text-white font-medium">{statusLabel}</span>.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <LuxuryCard
              title="Package Visibility"
              value={`${pkg.photo_count ?? 0} photo${pkg.photo_count === 1 ? "" : "s"}`}
              subtitle="Updated by TRI Shipping"
            />
            <LuxuryCard
              title="Service Level"
              value="Premium Handling"
              subtitle="Luxury meets logistics"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function LuxuryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[22px] bg-white/5 ring-1 ring-white/10 p-5">
      <div className="text-sm text-white/45">{title}</div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-white/55">{subtitle}</div>
    </div>
  );
}
