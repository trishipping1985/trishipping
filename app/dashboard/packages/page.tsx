"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPackages() {
    const { data } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    setPackages(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPackages();
  }, []);

  async function addPackage() {
    const code = trackingCode.trim();
    if (!code) return;

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    await supabase.from("packages").insert({
      user_id: userData.user.id,
      tracking_code: code,
      status: "RECEIVED",
      weight_kg: null,
      photo_count: 0,
    });

    setTrackingCode("");
    setSaving(false);
    loadPackages();
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
          className="rounded-xl px-6 py-3 font-semibold bg-[#d4af37] text-[#050914]"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </div>

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
              <div className="font-semibold text-lg">
                {p.tracking_code}
              </div>

              <div className="text-sm text-white/60 mt-1">
                Status: {p.status}
              </div>

              <div className="text-sm text-white/60">
                Weight: {p.weight_kg ? `${p.weight_kg} kg` : "Not added"}
              </div>

              <div className="text-sm text-white/60">
                Photos: {p.photo_count}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
