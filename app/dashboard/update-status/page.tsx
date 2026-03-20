"use client";

import { useEffect, useState } from "react";
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

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export default function UpdateStatusPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [status, setStatus] = useState("RECEIVED");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = String(params.get("code") || "")
      .trim()
      .toUpperCase();

    if (codeFromUrl) {
      setTrackingCode(codeFromUrl);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const cleanTrackingCode = trackingCode.trim().toUpperCase();
      const cleanLocation = location.trim();
      const cleanNote = note.trim();

      if (!cleanTrackingCode) {
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
        setError(lookupError.message);
        return;
      }

      if (!pkg) {
        setError("Package not found");
        return;
      }

      const packageRow = pkg as PackageRow;

      const { error: updateError } = await supabase
        .from("packages")
        .update({ status })
        .eq("id", packageRow.id);

      if (updateError) {
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
        setError(eventError.message);
        return;
      }

      const notificationRes = await fetch("/api/notifications", {
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

      if (!notificationRes.ok) {
        const notificationData = await notificationRes.json().catch(() => null);
        setError(notificationData?.error || "Notification failed");
        return;
      }

      let emailWarning = "";

      if (!packageRow.user_id) {
        emailWarning = " Status updated, but no package owner is linked.";
      } else {
        const { data: ownerData, error: ownerError } = await supabase
          .from("users")
          .select("id, email, full_name")
          .eq("id", packageRow.user_id)
          .maybeSingle();

        if (ownerError) {
          console.error("Owner lookup failed:", ownerError);
          emailWarning = " Status updated, but owner lookup failed.";
        } else if (!ownerData) {
          emailWarning = " Status updated, but customer record was not found.";
        } else {
          const owner = ownerData as UserRow;

          if (!owner.email) {
            emailWarning = " Status updated, but customer email is missing.";
          } else {
            const emailRes = await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: owner.email,
                subject: `Shipment Update - ${packageRow.tracking_code}`,
                trackingCode: packageRow.tracking_code,
                status,
                customerName: owner.full_name || owner.email,
                message:
                  status === "DELIVERED"
                    ? `Your package ${packageRow.tracking_code} has been delivered.`
                    : `Your package ${packageRow.tracking_code} is now ${status}.`,
              }),
            });

            if (!emailRes.ok) {
              const emailData = await emailRes.json().catch(() => null);
              console.error("Email notification failed:", emailData);
              emailWarning =
                emailData?.error
                  ? ` Status updated, but email failed: ${String(emailData.error)}`
                  : " Status updated, but email notification failed.";
            }
          }
        }
      }

      setMessage(`Shipment status updated.${emailWarning}`);
      setLocation("");
      setNote("");
    } catch (err) {
      console.error("Update status error:", err);
      setError("Something went wrong while updating the shipment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-3xl">
        <section className="relative overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-40 sm:w-40" />

          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
              TRI Shipping Operations
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:mt-4 sm:text-4xl">
              Update Shipment Status
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:mt-3 sm:text-base sm:leading-7">
              Update the package status, add location details, and notify the customer in one step.
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:mt-5 sm:rounded-[28px] sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Tracking Code
              </label>
              <input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                placeholder="Enter tracking code"
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                New Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white outline-none transition focus:border-[#F5C84B]/50"
              >
                <option value="RECEIVED">RECEIVED</option>
                <option value="IN TRANSIT">IN TRANSIT</option>
                <option value="OUT FOR DELIVERY">OUT FOR DELIVERY</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add current location"
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add optional note"
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-[#0B162B] px-4 py-4 text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/50"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[#F5C84B] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Status"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
