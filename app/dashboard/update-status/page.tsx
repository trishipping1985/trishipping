"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type PackageRow = {
  id: string;
  tracking_code: string;
  status: string | null;
  user_id: string | null;
};

export default function UpdateStatusPage() {
  const searchParams = useSearchParams();

  const [trackingCode, setTrackingCode] = useState("");
  const [status, setStatus] = useState("RECEIVED");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const codeFromUrl = String(searchParams.get("code") || "")
      .trim()
      .toUpperCase();

    if (codeFromUrl) {
      setTrackingCode(codeFromUrl);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const cleanTrackingCode = trackingCode.trim().toUpperCase();
    const cleanLocation = location.trim();
    const cleanNote = note.trim();

    if (!cleanTrackingCode) {
      setSaving(false);
      setError("Tracking code is required");
      return;
    }

    const { data: pkg, error: packageLookupError } = await supabase
      .from("packages")
      .select("id, tracking_code, status, user_id")
      .eq("tracking_code", cleanTrackingCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (packageLookupError) {
      setSaving(false);
      setError(packageLookupError.message);
      return;
    }

    if (!pkg) {
      setSaving(false);
      setError("Package not found");
      return;
    }

    const packageRow = pkg as PackageRow;

    const { error: updateError } = await supabase
      .from("packages")
      .update({
        status,
      })
      .eq("id", packageRow.id);

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    const { error: eventError } = await supabase
      .from("package_events")
      .insert({
        package_id: packageRow.id,
        tracking_code: packageRow.tracking_code,
        status,
        location: cleanLocation || null,
        note: cleanNote || null,
      });

    if (eventError) {
      setSaving(false);
      setError(eventError.message);
      return;
    }

    await fetch("/api/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tracking_code: packageRow.tracking_code,
        user_id: packageRow.user_id,
        status,
      }),
    });

    setSaving(false);
    setMessage("Shipment status updated successfully");
    setLocation("");
    setNote("");
  }

  return (
    <main className="min-h-screen bg-[#071427] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Shipment Control
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Update Shipment Status
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Update shipment progress, create a timeline event, and log a customer
            notification.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
              Location
            </label>
            <input
              value={location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLocation(e.target.value)
              }
              placeholder="Dubai Airport"
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/70">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNote(e.target.value)
              }
              placeholder="Departed facility"
              rows={4}
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-red-300">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-emerald-300">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Status"}
          </button>
        </form>
      </div>
    </main>
  );
}
