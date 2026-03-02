import Link from "next/link";

export default function PackagesPage() {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#d4af37]">Packages</h1>
        <Link
          href="/dashboard"
          className="rounded-xl px-4 py-2 text-sm font-semibold
                     bg-white/5 text-white ring-1 ring-white/12
                     hover:bg-white/10 transition"
        >
          Back
        </Link>
      </div>

      <p className="mt-2 text-white/65 text-sm">
        This will show your inbound packages and consolidated shipments.
      </p>

      <div className="mt-6 rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
        <div className="text-sm font-semibold">No packages yet</div>
        <div className="mt-2 text-sm text-white/60">
          Next step: connect Supabase tables and list packages here.
        </div>
      </div>
    </div>
  );
}
