"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
        <div className="w-full max-w-xl rounded-3xl bg-white/6 ring-1 ring-white/12 p-8 text-center">
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
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white/6 ring-1 ring-white/12 p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#d4af37]">Shipment Tracking</h1>
              <p className="mt-2 text-white/65">
                Tracking code: <span className="text-white font-medium">{pkg.tracking_code}</span>
              </p>
            </div>

            <Link
              href="/track"
              className="rounded-xl px-4 py-3 font-semibold bg-white/5 ring-1 ring-white/12 hover:bg-white/10 transition text-center"
            >
              New Search
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label="Status" value={pkg.status || "N/A"} />
            <InfoCard label="Photos" value={String(pkg.photo_count ?? 0)} />
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
      <div className="text-sm text-white/50">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}
