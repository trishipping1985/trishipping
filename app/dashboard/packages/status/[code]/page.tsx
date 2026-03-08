"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

const STATUS_OPTIONS = [
  "RECEIVED",
  "IN TRANSIT",
  "OUT FOR DELIVERY",
  "DELIVERED",
];

export default function PackageStatusPage() {
  const params = useParams();
  const router = useRouter();
  const codeParam = decodeURIComponent(String(params.code || ""))
    .trim()
    .toUpperCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pkg, setPkg] = useState<PackageRow | null>(null);
  const [status, setStatus] = useState("RECEIVED");

  useEffect(() => {
    async function loadPackage() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("packages")
        .select("id, tracking_code, status")
        .eq("tracking_code", codeParam)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      if (!data) {
        setError("Package not found");
        return;
      }

      setPkg(data as PackageRow);

      const currentStatus = (data.status || "RECEIVED")
        .toUpperCase()
        .replace(/_/g, " ");

      setStatus(currentStatus);
    }

    if (codeParam) loadPackage();
  }, [codeParam]);

  async function saveStatus(nextStatus: string) {
    if (!pkg) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const normalizedStatus =
      nextStatus === "IN TRANSIT"
        ? "IN_TRANSIT"
        : nextStatus === "OUT FOR DELIVERY"
        ? "OUT_FOR_DELIVERY"
        : nextStatus;

    const { error } = await supabase
      .from("packages")
      .update({ status: normalizedStatus })
      .eq("id", pkg.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setStatus(nextStatus);
    setSuccess("Status updated successfully");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
        <div className="text-xl font-semibold">Loading package...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Admin Status Updater
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Update Status
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Tracking Code: {pkg?.tracking_code || codeParam}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-6 py-5 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Current Status
          </p>
          <p className="mt-2 text-3xl font-extrabold text-[#F5C84B]">
            {status}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              disabled={saving || status === item}
              onClick={() => saveStatus(item)}
              className={`rounded-2xl px-6 py-4 text-lg font-bold transition ${
                status === item
                  ? "border border-[#F5C84B] bg-[#F5C84B] text-black"
                  : "border border-white/15 bg-black/20 text-white hover:bg-black/30"
              } disabled:opacity-60`}
            >
              {item}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-emerald-300">
            {success}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/dashboard/packages")}
            className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-8 py-4 text-lg font-bold text-white transition hover:bg-black/30"
          >
            Back to Packages
          </button>

          <button
            type="button"
            onClick={() => router.push(`/track/${encodeURIComponent(codeParam)}`)}
            className="flex-1 rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90"
          >
            View Public Tracking
          </button>
        </div>
      </div>
    </main>
  );
}
