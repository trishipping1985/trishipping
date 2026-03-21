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

function normalizeStatus(status: string | null) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ");
}

export default function TrackPage() {
  const params = useParams();
  const rawId = String(params.id || "");
  const trackingCode = decodeURIComponent(rawId).trim().toUpperCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pkg, setPkg] = useState<PackageRow | null>(null);

  useEffect(() => {
    async function loadTracking() {
      setLoading(true);
      setError("");

      const { data: packageData, error: packageError } = await supabase
        .from("packages")
        .select("id, tracking_code, status")
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
      setLoading(false);
    }

    if (trackingCode) {
      loadTracking();
    }
  }, [trackingCode]);

  const currentStatus = normalizeStatus(pkg?.status || "");

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
      <div className="mx-auto max-w-4xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-40 sm:w-40" />

          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
              TRI Shipping
            </div>

            <h1 className="mt-3 text-3xl font-extrabold text-[#F5C84B] sm:mt-4 sm:text-5xl">
              Track Shipment
            </h1>

            <p className="mt-3 break-all text-sm text-white/70 sm:text-lg">
              Tracking Code: {pkg.tracking_code}
            </p>

            <div className="mt-6 rounded-[22px] border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-5 py-6 shadow-xl backdrop-blur-xl sm:mt-8 sm:px-6 sm:py-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 sm:text-sm sm:tracking-[0.2em]">
                Current Status
              </p>
              <p className="mt-3 text-2xl font-extrabold text-[#F5C84B] sm:text-4xl">
                {currentStatus || "NOT SET"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
