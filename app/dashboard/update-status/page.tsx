"use client";

export const dynamic = "force-dynamic";

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

    const { data: pkg, error: lookupError } = await supabase
      .from("packages")
      .select("id, tracking_code, status, user_id")
      .eq("tracking_code", cleanTrackingCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      setSaving(false);
      setError(lookupError.message);
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
      .update({ status })
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
    setMessage("Shipment status updated");
    setLocation("");
    setNote("");
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white px-6 py-10">
      <div className="mx-auto max-w-3xl bg-white/5 border border-white/10 rounded-3xl p-10">

        <h1 className="text-4xl font-bold text-[#F5C84B] mb-6">
          Update Shipment Status
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
            placeholder="Tracking Code"
            className="w-full p-4 rounded-xl bg-black/30 border border-white/10"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-4 rounded-xl bg-black/30 border border-white/10"
          >
            <option value="RECEIVED">RECEIVED</option>
            <option value="IN TRANSIT">IN TRANSIT</option>
            <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full p-4 rounded-xl bg-black/30 border border-white/10"
          />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="w-full p-4 rounded-xl bg-black/30 border border-white/10"
          />

          {error && (
            <div className="text-red-400">{error}</div>
          )}

          {message && (
            <div className="text-green-400">{message}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#F5C84B] text-black font-bold py-4 rounded-xl"
          >
            {saving ? "Updating..." : "Update Status"}
          </button>

        </form>

      </div>
    </main>
  );
}
