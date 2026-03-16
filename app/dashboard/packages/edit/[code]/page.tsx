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
  user_id: string;
  tracking_code: string;
  status: string;
  notes: string | null;
  weight_kg: number | null;
};

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const codeParam = decodeURIComponent(String(params.code || ""))
    .trim()
    .toUpperCase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [packageId, setPackageId] = useState("");
  const [userId, setUserId] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [status, setStatus] = useState("RECEIVED");
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    async function loadPackage() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("packages")
        .select("id, user_id, tracking_code, status, notes, weight_kg")
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

      const pkg = data as PackageRow;
      setPackageId(pkg.id || "");
      setUserId(pkg.user_id || "");
      setTrackingCode(pkg.tracking_code || "");
      setStatus(pkg.status || "RECEIVED");
      setNotes(pkg.notes || "");
      setWeight(
        pkg.weight_kg === null || pkg.weight_kg === undefined
          ? ""
          : String(pkg.weight_kg)
      );
    }

    if (codeParam) loadPackage();
  }, [codeParam]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanUserId = userId.trim();
    const cleanTrackingCode = trackingCode.trim().toUpperCase();
    const cleanNotes = notes.trim();
    const cleanWeight = weight.trim();

    if (!packageId) {
      setError("Package not found");
      return;
    }

    if (!cleanUserId) {
      setError("User ID is required");
      return;
    }

    if (!cleanTrackingCode) {
      setError("Tracking code is required");
      return;
    }

    setSaving(true);

    const payload: {
      user_id: string;
      tracking_code: string;
      status: string;
      notes: string | null;
      weight_kg: number | null;
    } = {
      user_id: cleanUserId,
      tracking_code: cleanTrackingCode,
      status,
      notes: cleanNotes || null,
      weight_kg: cleanWeight ? Number(cleanWeight) : null,
    };

    const { error } = await supabase
      .from("packages")
      .update(payload)
      .eq("id", packageId);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Package updated successfully");

    setTimeout(() => {
      router.push("/dashboard/packages");
    }, 1000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#071427] px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="animate-pulse">
              <div className="h-5 w-40 rounded bg-[#F5C84B]/15" />
              <div className="mt-5 h-12 w-72 rounded bg-white/10" />
              <div className="mt-4 h-5 w-96 max-w-full rounded bg-white/10" />

              <div className="mt-10 grid gap-6">
                <div className="h-24 rounded-3xl bg-white/5" />
                <div className="h-24 rounded-3xl bg-white/5" />
                <div className="h-24 rounded-3xl bg-white/5" />
                <div className="h-36 rounded-3xl bg-white/5" />
                <div className="h-24 rounded-3xl bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071427] px-4 py-8 text-white md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        <section className="relative overflow-hidden rounded-[32px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[#F5C84B]/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#F5C84B]">
                TRI Shipping Operations
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Edit Package
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
                Update shipment details and keep package information accurate and consistent.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                Package
              </div>
              <div className="mt-1 text-sm font-semibold text-[#F5C84B]">
                {trackingCode || codeParam || "-"}
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-8">
            <div className="border-b border-white/10 pb-6">
              <h2 className="text-2xl font-bold text-[#F5C84B] sm:text-3xl">
                Shipment Information
              </h2>
              <p className="mt-2 text-sm text-white/55">
                Edit the core package fields used across tracking and operations.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  User ID
                </label>
                <input
                  value={userId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUserId(e.target.value)
                  }
                  placeholder="Customer user_id"
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
                />
                <p className="mt-2 text-xs text-white/40">
                  The package will remain linked to this customer account.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Tracking Code
                </label>
                <input
                  value={trackingCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTrackingCode(e.target.value.toUpperCase())
                  }
                  placeholder="TRI-001"
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatus(e.target.value)
                  }
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white outline-none transition focus:border-[#F5C84B]/60"
                >
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="IN TRANSIT">IN TRANSIT</option>
                  <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Weight (kg)
                </label>
                <input
                  value={weight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWeight(e.target.value)
                  }
                  placeholder="Optional weight"
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Package notes"
                  rows={5}
                  className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60"
                />
                <p className="mt-2 text-xs text-white/40">
                  Add internal notes or shipment context that may help staff later.
                </p>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-emerald-300">
              {success}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard/packages")}
              className="rounded-2xl border border-white/15 bg-black/20 px-8 py-4 text-base font-bold text-white transition hover:bg-black/30"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-[#F5C84B] px-8 py-4 text-base font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
