"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function loadPackages() {
    setError("");
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    setPackages(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPackages();
  }, []);

  async function addPackage() {
    setError("");
    setOk("");

    const code = trackingCode.trim();
    if (!code) {
      setError("Enter a tracking code.");
      return;
    }

    setSaving(true);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setError(userErr.message);
      setSaving(false);
      return;
    }
    if (!userData?.user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    const { error: insErr } = await supabase.from("packages").insert({
      user_id: userData.user.id,
      tracking_code: code,
      status: "RECEIVED",
    });

    if (insErr) {
      setError(insErr.message);
      setSaving(false);
      return;
    }

    setTrackingCode("");
    setOk("Added.");
    setSaving(false);
    await loadPackages();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4af37]">Packages</h1>

      <div className="mt-6 flex gap-3 items-center">
        <input
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="Tracking code"
          className="rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3 text-white w-80"
        />

        <button
          type="button"
          onClick={addPackage}
          disabled={saving}
          className="rounded-xl px-6 py-3 font-semibold bg-[#d4af37] text-[#050914] disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </div>

      {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
      {ok ? <div className="mt-3 text-sm text-green-300">{ok}</div> : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-white/70">Loading...</div>
        ) : packages.length === 0 ? (
          <div className="text-white/70">No packages yet</div>
        ) : (
          packages.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4 text-white"
            >
              <div className="font-semibold">{p.tracking_code}</div>
              <div className="text-xs text-white/50">{p.status}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
