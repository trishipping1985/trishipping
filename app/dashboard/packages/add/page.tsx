"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function AddPackagePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [status, setStatus] = useState("RECEIVED");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function makeTrackingCode() {
    const random = Math.floor(100 + Math.random() * 900);
    setTrackingCode(`TRI-${random}`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanUserId = userId.trim();
    const cleanTrackingCode = trackingCode.trim().toUpperCase();
    const cleanDescription = description.trim();
    const cleanWeight = weight.trim();

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
      description?: string;
      weight?: number;
    } = {
      user_id: cleanUserId,
      tracking_code: cleanTrackingCode,
      status,
    };

    if (cleanDescription) payload.description = cleanDescription;
    if (cleanWeight) payload.weight = Number(cleanWeight);

    const { error: insertError } = await supabase
      .from("packages")
      .insert([payload]);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess("Package added successfully");
    setUserId("");
    setTrackingCode("");
    setStatus("RECEIVED");
    setDescription("");
    setWeight("");

    setTimeout(() => {
      router.push("/dashboard/packages");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Admin Package Creation
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Add Box
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Create a new shipment and assign its first tracking details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              User ID
            </label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Paste customer user_id"
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Tracking Code
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="TRI-001"
                className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
              />
              <button
                type="button"
                onClick={makeTrackingCode}
                className="rounded-2xl border border-[#F5C84B]/30 bg-[#F5C84B]/10 px-6 py-4 font-bold text-[#F5C84B] transition hover:opacity-90"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white outline-none focus:border-[#F5C84B]/60"
            >
              <option value="RECEIVED">RECEIVED</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional package notes"
              rows={4}
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Weight
            </label>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
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
              {saving ? "Saving..." : "Add Package"}
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
