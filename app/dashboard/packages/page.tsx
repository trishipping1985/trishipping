"use client";

import { useRouter } from "next/navigation";

export default function PackagesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#071427] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              TRI Shipping Dashboard
            </p>

            <h1 className="mt-3 text-5xl font-extrabold text-[#F5C84B]">
              Shipments
            </h1>

            <p className="mt-4 text-lg text-white/70">
              Manage packages, tracking, and shipment status across warehouses.
            </p>
          </div>

          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => router.push("/dashboard/packages/add")}
              className="rounded-2xl bg-[#F5C84B] px-6 py-3 font-bold text-black transition hover:opacity-90"
            >
              Add Box
            </button>

            <button
              className="rounded-2xl border border-white/15 bg-black/20 px-6 py-3 font-semibold text-white/80"
            >
              Edit Selected
            </button>

            <button
              onClick={() => router.push("/dashboard/update-status")}
              className="rounded-2xl border border-white/15 bg-black/20 px-6 py-3 font-semibold text-white/80"
            >
              Update Status
            </button>

            <button
              className="rounded-2xl border border-white/15 bg-black/20 px-6 py-3 font-semibold text-white/80"
            >
              Photos
            </button>

          </div>
        </div>

        {/* INFO BAR */}

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white/60">
          Select a package row to activate Edit Selected, Update Status, and Photos.
        </div>

        {/* SEARCH */}

        <div className="mt-6">
          <input
            placeholder="Search by tracking code"
            className="w-full rounded-2xl border border-white/15 bg-black/20 px-6 py-4 text-white placeholder:text-white/35 outline-none focus:border-[#F5C84B]/60"
          />
        </div>

        {/* TABLE HEADER */}

        <div className="mt-10 grid grid-cols-5 gap-4 border-b border-white/10 pb-3 text-sm uppercase tracking-wider text-[#F5C84B]">
          <div>Tracking Code</div>
          <div>Status</div>
          <div>Weight</div>
          <div>Photos</div>
          <div>View</div>
        </div>

      </div>
    </main>
  );
}
