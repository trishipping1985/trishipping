"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(true);

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
    if (!trackingCode.trim()) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase.from("packages").insert({
      user_id: userData.user.id,
      tracking_code: trackingCode,
    });

    setTrackingCode("");
    loadPackages();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4af37]">Packages</h1>

      <div className="mt-6 flex gap-3">
        <input
          value={trackingCode}
          onChange={(e) => setTrackingCode(e.target.value)}
          placeholder="Tracking code"
          className="rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3 text-white"
        />
        <button
          onClick={addPackage}
          className="rounded-xl px-4 py-3 font-semibold bg-[#d4af37] text-[#050914]"
        >
          Add
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div>Loading...</div>
        ) : packages.length === 0 ? (
          <div>No packages yet</div>
        ) : (
          packages.map((p) => (
            <div
              key={p.id}
              className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4"
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
