"use client";

import { useState } from "react";

export default function TrackPage() {
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const clean = code.trim().toUpperCase();
    if (!clean) return;

    window.location.href = `/track/${clean}`;
  }

  return (
    <main className="min-h-screen bg-[#071427] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-[#F5C84B]">Tracking</h1>
          <p className="mt-3 text-white/70">
            Enter your tracking code to view shipment status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            value={code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCode(e.target.value)
            }
            placeholder="TRI-001"
            className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-[#F5C84B]/60"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#F5C84B] px-6 py-3 font-bold text-black hover:opacity-90"
          >
            Track
          </button>
        </form>
      </div>
    </main>
  );
}
