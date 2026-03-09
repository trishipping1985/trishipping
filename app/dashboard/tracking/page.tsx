"use client";

import { useState } from "react";

export default function DashboardTrackingPage() {
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const clean = code.trim().toUpperCase();
    if (!clean) return;

    window.location.href = `/track/${clean}`;
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-white/50">
            Dashboard Tracking
          </p>

          <h1 className="mt-4 text-5xl font-extrabold text-[#F5C84B]">
            Track Shipment
          </h1>

          <p className="mt-4 text-lg text-white/70">
            Enter a tracking code to view the latest shipment status.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-6 py-5 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">
            Quick Lookup
          </p>
          <p className="mt-2 text-2xl font-bold text-[#F5C84B]">
            Premium Shipment Search
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 sm:flex-row">
          <input
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCode(e.target.value)
            }
            placeholder="Enter tracking code (e.g. TRI-001)"
            className="flex-1 rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-lg text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
          />

          <button
            type="submit"
            className="rounded-2xl bg-[#F5C84B] px-8 py-4 text-lg font-bold text-black transition hover:opacity-90"
          >
            Track
          </button>
        </form>
      </div>
    </main>
  );
}
