"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackHomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function go() {
    const c = code.trim();
    if (!c) return;
    router.push(`/track/${encodeURIComponent(c)}`);
  }

  return (
    <main className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 shadow-[0_0_120px_rgba(245,158,11,0.08)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs tracking-widest text-white/70">
            TRI SHIPPING • TRACKING
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-yellow-400">
            Track Your Shipment
          </h1>

          <p className="mt-3 text-white/60">
            Enter your tracking code to view the latest status and photos.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. TRI-001"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-yellow-400/60"
          />

          <button
            onClick={go}
            className="rounded-2xl bg-yellow-400 px-7 py-4 font-semibold text-black hover:bg-yellow-300"
          >
            Track
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-white/40">
          Where Luxury Meets Logistics
        </div>
      </div>
    </main>
  );
}
