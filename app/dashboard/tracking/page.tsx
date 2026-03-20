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
    <main className="min-h-screen bg-[#071427] px-3 py-3 text-white sm:px-4 sm:py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-3xl items-center sm:min-h-[calc(100vh-32px)] md:min-h-[calc(100vh-48px)]">
        <section className="relative w-full overflow-hidden rounded-[22px] border border-[#F5C84B]/15 bg-[radial-gradient(circle_at_top_right,rgba(245,200,75,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:rounded-[28px] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(245,200,75,0.05),transparent)]" />
          <div className="absolute -right-16 top-0 h-32 w-32 rounded-full bg-[#F5C84B]/10 blur-3xl sm:h-40 sm:w-40" />

          <div className="relative z-10">
            <div className="text-center">
              <div className="inline-flex items-center rounded-full border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F5C84B] sm:px-4 sm:text-xs sm:tracking-[0.3em]">
                Dashboard Tracking
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight text-[#F5C84B] sm:mt-4 sm:text-4xl">
                Track Shipment
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/70 sm:mt-3 sm:text-base sm:leading-7">
                Enter a tracking code to view the latest shipment status.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-[#F5C84B]/20 bg-[#F5C84B]/10 px-4 py-4 text-center sm:mt-6 sm:px-6 sm:py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 sm:text-xs sm:tracking-[0.2em]">
                Quick Lookup
              </p>
              <p className="mt-2 text-lg font-bold text-[#F5C84B] sm:text-2xl">
                Premium Shipment Search
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row"
            >
              <input
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.target.value)
                }
                placeholder="Enter tracking code"
                className="flex-1 rounded-2xl border border-white/15 bg-[#0B162B] px-4 py-4 text-base text-white placeholder:text-white/35 outline-none transition focus:border-[#F5C84B]/60 sm:px-5 sm:text-lg"
              />

              <button
                type="submit"
                className="rounded-2xl bg-[#F5C84B] px-6 py-4 text-base font-black uppercase tracking-[0.14em] text-black transition hover:opacity-90 sm:px-8 sm:text-lg"
              >
                Track
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
