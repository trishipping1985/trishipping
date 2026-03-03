"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackPage() {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = useState("");

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();

    const code = trackingCode.trim();
    if (!code) return;

    router.push(`/track/${encodeURIComponent(code)}`);
  }

  return (
    <main className="min-h-screen bg-[#050914] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl bg-white/6 ring-1 ring-white/12 p-8 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-[#d4af37]">Track Your Shipment</h1>
        <p className="mt-2 text-white/65">
          Enter your tracking code to view the latest shipment status.
        </p>

        <form onSubmit={handleTrack} className="mt-6 flex gap-3">
          <input
            type="text"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="Enter tracking code"
            className="flex-1 rounded-xl bg-white/5 ring-1 ring-white/12 px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
          />

          <button
            type="submit"
            className="rounded-xl px-5 py-3 font-semibold bg-[#d4af37] text-[#050914] hover:bg-[#e6c55a] transition"
          >
            Track
          </button>
        </form>
      </div>
    </main>
  );
}
