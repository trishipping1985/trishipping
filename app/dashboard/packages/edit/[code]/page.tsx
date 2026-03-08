\"use client";

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
            Admin Package Editor
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Edit Box
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Update shipment details and correct package information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              User ID
            </label>
            <input
              value={userId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUserId(e.target.value)
              }
              placeholder="Customer user_id"
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
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
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
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
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white outline-none focus:border-[#F5C84B]/60"
            >
              <option value="RECEIVED">RECEIVED</option>
              <option value="IN TRANSIT">IN TRANSIT</option>
              <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Package notes"
              rows={4}
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
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
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

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

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/packages")}
              className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-8 py-4 text-lg font-bold text-white transition hover:bg-black/30"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
